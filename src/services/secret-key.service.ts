import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecretKey, SecretKeyType } from '../entities/secret-key.entity';
import { CreateSecretKeyDto, UpdateSecretKeyDto, SecretKeyResponseDto, SecretKeyListResponseDto } from '../dto/secret-key.dto';

@Injectable()
export class SecretKeyService {
  constructor(
    @InjectRepository(SecretKey)
    private secretKeyRepository: Repository<SecretKey>,
  ) {}

  async create(createDto: CreateSecretKeyDto, userId: number): Promise<SecretKeyResponseDto> {
    const secretKey = this.secretKeyRepository.create({
      ...createDto,
      createdBy: userId,
      isActive: createDto.isActive ?? true,
      expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : undefined,
    });

    const saved = await this.secretKeyRepository.save(secretKey);
    return this.toResponseDto(saved);
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

    return this.toResponseDto(secretKey);
  }

  async update(id: number, updateDto: UpdateSecretKeyDto, userId: number): Promise<SecretKeyResponseDto> {
    const secretKey = await this.secretKeyRepository.findOne({
      where: { id, createdBy: userId },
    });

    if (!secretKey) {
      throw new NotFoundException('Secret key not found');
    }

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
    }

    Object.assign(secretKey, {
      ...updateDto,
      expiresAt: updateDto.expiresAt ? new Date(updateDto.expiresAt) : secretKey.expiresAt,
    });

    const updated = await this.secretKeyRepository.save(secretKey);
    return this.toResponseDto(updated);
  }

  async remove(id: number, userId: number): Promise<void> {
    const secretKey = await this.secretKeyRepository.findOne({
      where: { id, createdBy: userId },
    });

    if (!secretKey) {
      throw new NotFoundException('Secret key not found');
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
    return this.toResponseDto(updated);
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
    return this.toResponseDto(updated);
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

  private toResponseDto(secretKey: SecretKey): SecretKeyResponseDto {
    return {
      id: secretKey.id,
      name: secretKey.name,
      description: secretKey.description || '',
      value: secretKey.value,
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