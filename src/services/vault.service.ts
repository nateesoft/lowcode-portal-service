import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface VaultConfig {
  endpoint: string;
  token: string;
  mount: string;
}

export interface VaultSecret {
  path: string;
  data: Record<string, any>;
  metadata?: {
    created_time: string;
    deletion_time?: string;
    destroyed: boolean;
    version: number;
  };
}

export interface VaultSecretVersion {
  version: number;
  created_time: string;
  deletion_time?: string;
  destroyed: boolean;
}

@Injectable()
export class VaultService {
  private readonly logger = new Logger(VaultService.name);
  private vaultClient: AxiosInstance;
  private config: VaultConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      endpoint: this.configService.get<string>('VAULT_ENDPOINT', 'http://localhost:8200'),
      token: this.configService.get<string>('VAULT_TOKEN', 'root'),
      mount: this.configService.get<string>('VAULT_MOUNT', 'secret'),
    };

    this.vaultClient = axios.create({
      baseURL: this.config.endpoint,
      headers: {
        'X-Vault-Token': this.config.token,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.vaultClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`Making request to: ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    this.vaultClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`Response from ${response.config.url}: ${response.status}`);
        return response;
      },
      (error) => {
        this.logger.error(`Response error from ${error.config?.url}:`, {
          status: error.response?.status,
          message: error.response?.data?.errors || error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  async isVaultAvailable(): Promise<boolean> {
    try {
      const response = await this.vaultClient.get('/v1/sys/health');
      return response.status === 200;
    } catch (error) {
      this.logger.warn('Vault is not available:', error.message);
      return false;
    }
  }

  async createSecret(path: string, data: Record<string, any>): Promise<VaultSecret> {
    try {
      const fullPath = `v1/${this.config.mount}/data/${path}`;
      const payload = {
        data: data,
        options: {
          // Enable versioning
        }
      };

      const response = await this.vaultClient.post(fullPath, payload);
      
      this.logger.log(`Created secret at path: ${path}`);
      
      return {
        path,
        data,
        metadata: response.data?.data?.metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to create secret at path ${path}:`, error.message);
      throw new BadRequestException(`Failed to create secret: ${error.message}`);
    }
  }

  async getSecret(path: string, version?: number): Promise<VaultSecret | null> {
    try {
      let fullPath = `v1/${this.config.mount}/data/${path}`;
      if (version) {
        fullPath += `?version=${version}`;
      }

      const response = await this.vaultClient.get(fullPath);
      
      if (!response.data?.data?.data) {
        return null;
      }

      return {
        path,
        data: response.data.data.data,
        metadata: response.data.data.metadata,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      this.logger.error(`Failed to get secret at path ${path}:`, error.message);
      throw new BadRequestException(`Failed to get secret: ${error.message}`);
    }
  }

  async updateSecret(path: string, data: Record<string, any>): Promise<VaultSecret> {
    try {
      // Get current secret to merge data
      const currentSecret = await this.getSecret(path);
      const mergedData = currentSecret ? { ...currentSecret.data, ...data } : data;

      const fullPath = `v1/${this.config.mount}/data/${path}`;
      const payload = {
        data: mergedData,
        options: {}
      };

      const response = await this.vaultClient.post(fullPath, payload);
      
      this.logger.log(`Updated secret at path: ${path}`);
      
      return {
        path,
        data: mergedData,
        metadata: response.data?.data?.metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to update secret at path ${path}:`, error.message);
      throw new BadRequestException(`Failed to update secret: ${error.message}`);
    }
  }

  async deleteSecret(path: string): Promise<void> {
    try {
      const fullPath = `v1/${this.config.mount}/data/${path}`;
      await this.vaultClient.delete(fullPath);
      
      this.logger.log(`Deleted secret at path: ${path}`);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Secret not found');
      }
      this.logger.error(`Failed to delete secret at path ${path}:`, error.message);
      throw new BadRequestException(`Failed to delete secret: ${error.message}`);
    }
  }

  async listSecrets(path: string = ''): Promise<string[]> {
    try {
      const fullPath = `v1/${this.config.mount}/metadata/${path}`;
      const response = await this.vaultClient.request({
        method: 'LIST',
        url: fullPath,
      });

      return response.data?.data?.keys || [];
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      this.logger.error(`Failed to list secrets at path ${path}:`, error.message);
      throw new BadRequestException(`Failed to list secrets: ${error.message}`);
    }
  }

  async getSecretVersions(path: string): Promise<VaultSecretVersion[]> {
    try {
      const fullPath = `v1/${this.config.mount}/metadata/${path}`;
      const response = await this.vaultClient.get(fullPath);

      const versions = response.data?.data?.versions || {};
      return Object.entries(versions).map(([version, data]: [string, any]) => ({
        version: parseInt(version),
        created_time: data.created_time,
        deletion_time: data.deletion_time,
        destroyed: data.destroyed,
      }));
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      this.logger.error(`Failed to get secret versions at path ${path}:`, error.message);
      throw new BadRequestException(`Failed to get secret versions: ${error.message}`);
    }
  }

  async destroySecretVersion(path: string, versions: number[]): Promise<void> {
    try {
      const fullPath = `v1/${this.config.mount}/destroy/${path}`;
      const payload = { versions };

      await this.vaultClient.post(fullPath, payload);
      
      this.logger.log(`Destroyed secret versions at path: ${path}, versions: ${versions.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to destroy secret versions at path ${path}:`, error.message);
      throw new BadRequestException(`Failed to destroy secret versions: ${error.message}`);
    }
  }

  generateSecretPath(userId: number, secretName: string): string {
    // Create a path structure: users/{userId}/secrets/{secretName}
    return `users/${userId}/secrets/${secretName.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
  }

  // Helper method to check if we should use Vault
  async shouldUseVault(): Promise<boolean> {
    const isEnabled = this.configService.get<boolean>('VAULT_ENABLED', true);
    if (!isEnabled) {
      return false;
    }
    
    return await this.isVaultAvailable();
  }
}