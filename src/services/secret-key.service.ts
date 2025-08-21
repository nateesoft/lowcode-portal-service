import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecretKey, SecretKeyType } from '../entities/secret-key.entity';
import { CreateSecretKeyDto, UpdateSecretKeyDto, SecretKeyResponseDto, SecretKeyListResponseDto } from '../dto/secret-key.dto';
import { VaultService } from './vault.service';

@Injectable()
export class SecretKeyService {
  private readonly logger = new Logger(SecretKeyService.name);

  constructor(
    @InjectRepository(SecretKey)
    private secretKeyRepository: Repository<SecretKey>,
    private vaultService: VaultService,
  ) {}

  async create(createDto: CreateSecretKeyDto, userId: number): Promise<SecretKeyResponseDto> {
    // Try to store in Vault first
    const useVault = await this.vaultService.shouldUseVault();
    let vaultPath: string | null = null;
    
    if (useVault) {
      try {
        vaultPath = this.vaultService.generateSecretPath(userId, createDto.name);
        await this.vaultService.createSecret(vaultPath, {
          name: createDto.name,
          description: createDto.description,
          value: createDto.value,
          type: createDto.type,
          tags: createDto.tags,
          metadata: createDto.metadata || {}
        });
        this.logger.log(`Secret stored in Vault at path: ${vaultPath}`);
      } catch (error) {
        this.logger.warn(`Failed to store in Vault, falling back to database:`, error.message);
        vaultPath = null;
      }
    }

    // Create database record (with or without vault reference)
    const secretKey = this.secretKeyRepository.create({
      ...createDto,
      value: vaultPath ? `vault:${vaultPath}` : createDto.value, // Store vault path reference if using vault
      createdBy: userId,
      isActive: createDto.isActive ?? true,
      expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : undefined,
      metadata: {
        ...createDto.metadata,
        storedInVault: !!vaultPath,
        vaultPath: vaultPath || undefined
      }
    });

    const saved = await this.secretKeyRepository.save(secretKey);
    return this.toResponseDto(saved, useVault);
  }

  async findAll(userId: number): Promise<SecretKeyListResponseDto[]> {
    const secretKeys = await this.secretKeyRepository.find({
      where: { createdBy: userId },
      order: { createdAt: 'DESC' },
    });

    return secretKeys.map(sk => this.toListResponseDto(sk));
  }

  async findOne(id: number, userId: number): Promise<SecretKeyResponseDto> {
    const secretKey = await this.secretKeyRepository.findOne({
      where: { id, createdBy: userId },
    });

    if (!secretKey) {
      throw new NotFoundException('Secret key not found');
    }

    // Update access tracking
    await this.updateAccessTracking(secretKey);

    const useVault = await this.vaultService.shouldUseVault();
    return this.toResponseDto(secretKey, useVault);
  }

  async update(id: number, updateDto: UpdateSecretKeyDto, userId: number): Promise<SecretKeyResponseDto> {
    const secretKey = await this.secretKeyRepository.findOne({
      where: { id, createdBy: userId },
    });

    if (!secretKey) {
      throw new NotFoundException('Secret key not found');
    }

    const useVault = await this.vaultService.shouldUseVault();
    const isStoredInVault = secretKey.metadata?.storedInVault;
    const vaultPath = secretKey.metadata?.vaultPath;

    // Handle rotation history if value is being updated
    if (updateDto.value && updateDto.value !== secretKey.value) {
      const rotationEntry = {
        timestamp: new Date().toISOString(),
        previousValueHash: this.hashValue(secretKey.value),
        reason: 'manual_update'
      };
      
      const currentHistory = secretKey.rotationHistory ? 
        JSON.parse(secretKey.rotationHistory) : [];
      currentHistory.push(rotationEntry);
      
      secretKey.rotationHistory = JSON.stringify(currentHistory);

      // Update in Vault if stored there
      if (useVault && isStoredInVault && vaultPath) {
        try {
          await this.vaultService.updateSecret(vaultPath, {
            value: updateDto.value,
            name: updateDto.name || secretKey.name,
            description: updateDto.description || secretKey.description,
            type: updateDto.type || secretKey.type,
            tags: updateDto.tags || secretKey.tags,
            metadata: {
              ...secretKey.metadata,
              ...updateDto.metadata,
              lastUpdated: new Date().toISOString()
            }
          });
          this.logger.log(`Secret updated in Vault at path: ${vaultPath}`);
        } catch (error) {
          this.logger.error(`Failed to update secret in Vault: ${error.message}`);
          // Continue with database update even if Vault fails
        }
      }
    }

    Object.assign(secretKey, {
      ...updateDto,
      expiresAt: updateDto.expiresAt ? new Date(updateDto.expiresAt) : secretKey.expiresAt,
    });

    const updated = await this.secretKeyRepository.save(secretKey);
    return this.toResponseDto(updated, useVault);
  }

  async remove(id: number, userId: number): Promise<void> {
    const secretKey = await this.secretKeyRepository.findOne({
      where: { id, createdBy: userId },
    });

    if (!secretKey) {
      throw new NotFoundException('Secret key not found');
    }

    const useVault = await this.vaultService.shouldUseVault();
    const isStoredInVault = secretKey.metadata?.storedInVault;
    const vaultPath = secretKey.metadata?.vaultPath;

    // Remove from Vault if stored there
    if (useVault && isStoredInVault && vaultPath) {
      try {
        await this.vaultService.deleteSecret(vaultPath);
        this.logger.log(`Secret deleted from Vault at path: ${vaultPath}`);
      } catch (error) {
        this.logger.error(`Failed to delete secret from Vault: ${error.message}`);
        // Continue with database deletion even if Vault fails
      }
    }

    await this.secretKeyRepository.remove(secretKey);
  }

  async findByType(type: SecretKeyType, userId: number): Promise<SecretKeyListResponseDto[]> {
    const secretKeys = await this.secretKeyRepository.find({
      where: { type, createdBy: userId },
      order: { createdAt: 'DESC' },
    });

    return secretKeys.map(sk => this.toListResponseDto(sk));
  }

  async findExpired(userId: number): Promise<SecretKeyListResponseDto[]> {
    const now = new Date();
    const secretKeys = await this.secretKeyRepository
      .createQueryBuilder('sk')
      .where('sk.createdBy = :userId', { userId })
      .andWhere('sk.expiresAt IS NOT NULL')
      .andWhere('sk.expiresAt < :now', { now })
      .orderBy('sk.expiresAt', 'ASC')
      .getMany();

    return secretKeys.map(sk => this.toListResponseDto(sk));
  }

  async findExpiringSoon(userId: number, days: number = 7): Promise<SecretKeyListResponseDto[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const secretKeys = await this.secretKeyRepository
      .createQueryBuilder('sk')
      .where('sk.createdBy = :userId', { userId })
      .andWhere('sk.expiresAt IS NOT NULL')
      .andWhere('sk.expiresAt > :now', { now })
      .andWhere('sk.expiresAt <= :futureDate', { futureDate })
      .orderBy('sk.expiresAt', 'ASC')
      .getMany();

    return secretKeys.map(sk => this.toListResponseDto(sk));
  }

  async search(query: string, userId: number): Promise<SecretKeyListResponseDto[]> {
    const secretKeys = await this.secretKeyRepository
      .createQueryBuilder('sk')
      .where('sk.createdBy = :userId', { userId })
      .andWhere(
        '(sk.name ILIKE :query OR sk.description ILIKE :query OR sk.tags::text ILIKE :query)',
        { query: `%${query}%` }
      )
      .orderBy('sk.createdAt', 'DESC')
      .getMany();

    return secretKeys.map(sk => this.toListResponseDto(sk));
  }

  async deactivate(id: number, userId: number): Promise<SecretKeyResponseDto> {
    const secretKey = await this.secretKeyRepository.findOne({
      where: { id, createdBy: userId },
    });

    if (!secretKey) {
      throw new NotFoundException('Secret key not found');
    }

    secretKey.isActive = false;
    const updated = await this.secretKeyRepository.save(secretKey);
    const useVault = await this.vaultService.shouldUseVault();
    return this.toResponseDto(updated, useVault);
  }

  async activate(id: number, userId: number): Promise<SecretKeyResponseDto> {
    const secretKey = await this.secretKeyRepository.findOne({
      where: { id, createdBy: userId },
    });

    if (!secretKey) {
      throw new NotFoundException('Secret key not found');
    }

    secretKey.isActive = true;
    const updated = await this.secretKeyRepository.save(secretKey);
    const useVault = await this.vaultService.shouldUseVault();
    return this.toResponseDto(updated, useVault);
  }

  private async updateAccessTracking(secretKey: SecretKey): Promise<void> {
    secretKey.lastAccessedAt = new Date();
    secretKey.accessCount += 1;
    await this.secretKeyRepository.save(secretKey);
  }

  private hashValue(value: string): string {
    // Simple hash for demonstration - in production use proper crypto
    return Buffer.from(value).toString('base64').substring(0, 16);
  }

  private maskValue(value: string): string {
    if (!value) return '••••••••';
    if (value.length <= 8) return '••••••••';
    return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
  }

  private async toResponseDto(secretKey: SecretKey, useVault: boolean = false): Promise<SecretKeyResponseDto> {
    let actualValue = secretKey.value;
    
    // If value is stored in Vault, retrieve it
    if (useVault && secretKey.value?.startsWith('vault:')) {
      const vaultPath = secretKey.value.replace('vault:', '');
      try {
        const vaultSecret = await this.vaultService.getSecret(vaultPath);
        actualValue = vaultSecret?.data?.value || secretKey.value;
      } catch (error) {
        this.logger.warn(`Failed to retrieve secret from Vault: ${error.message}`);
        // Fall back to the stored value (which might be the vault path)
      }
    }

    return {
      id: secretKey.id,
      name: secretKey.name,
      description: secretKey.description || '',
      value: actualValue,
      type: secretKey.type,
      expiresAt: secretKey.expiresAt?.toISOString(),
      tags: secretKey.tags || [],
      isActive: secretKey.isActive,
      metadata: secretKey.metadata,
      rotationHistory: secretKey.rotationHistory,
      lastAccessedAt: secretKey.lastAccessedAt?.toISOString(),
      accessCount: secretKey.accessCount,
      createdAt: secretKey.createdAt.toISOString(),
      updatedAt: secretKey.updatedAt.toISOString(),
      createdBy: secretKey.createdBy,
      isExpired: secretKey.isExpired,
      isExpiringSoon: secretKey.isExpiringSoon,
      lastModified: secretKey.lastModified.toISOString(),
    };
  }

  private toListResponseDto(secretKey: SecretKey): SecretKeyListResponseDto {
    return {
      id: secretKey.id,
      name: secretKey.name,
      description: secretKey.description || '',
      maskedValue: this.maskValue(secretKey.value),
      type: secretKey.type,
      expiresAt: secretKey.expiresAt?.toISOString(),
      tags: secretKey.tags || [],
      isActive: secretKey.isActive,
      lastAccessedAt: secretKey.lastAccessedAt?.toISOString(),
      accessCount: secretKey.accessCount,
      createdAt: secretKey.createdAt.toISOString(),
      updatedAt: secretKey.updatedAt.toISOString(),
      createdBy: secretKey.createdBy,
      isExpired: secretKey.isExpired,
      isExpiringSoon: secretKey.isExpiringSoon,
      lastModified: secretKey.lastModified.toISOString(),
    };
  }
}