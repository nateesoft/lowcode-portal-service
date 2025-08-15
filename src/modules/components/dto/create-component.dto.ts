import { IsString, IsOptional, IsObject, IsBoolean, IsArray } from 'class-validator';

export class CreateComponentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  type: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsObject()
  props?: any;

  @IsOptional()
  @IsObject()
  styles?: any;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  // For history tracking
  @IsOptional()
  userId?: number;

  @IsOptional()
  @IsString()
  changeDescription?: string;
}