import { IsString, IsOptional, IsBoolean, IsNumber, IsObject, IsArray } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  nodes?: any;

  @IsOptional()
  @IsArray()
  edges?: any;

  @IsOptional()
  @IsObject()
  viewport?: any;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsString()
  changeDescription?: string;

  @IsNumber()
  createdBy: number;
}