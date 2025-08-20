import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsDateString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { SecretKeyType } from '../entities/secret-key.entity';

export class CreateSecretKeyDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  value: string;

  @IsEnum(SecretKeyType)
  type: SecretKeyType;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  metadata?: any;
}

export class UpdateSecretKeyDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsEnum(SecretKeyType)
  @IsOptional()
  type?: SecretKeyType;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  metadata?: any;
}

export class SecretKeyResponseDto {
  id: number;
  name: string;
  description: string;
  value: string;
  type: SecretKeyType;
  expiresAt?: string;
  tags: string[];
  isActive: boolean;
  metadata?: any;
  rotationHistory?: string;
  lastAccessedAt?: string;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  lastModified: string;
}

export class SecretKeyListResponseDto {
  id: number;
  name: string;
  description: string;
  maskedValue: string;
  type: SecretKeyType;
  expiresAt?: string;
  tags: string[];
  isActive: boolean;
  lastAccessedAt?: string;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  lastModified: string;
}