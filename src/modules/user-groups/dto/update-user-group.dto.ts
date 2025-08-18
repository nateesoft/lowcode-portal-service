import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class UpdateUserGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  permissions?: string[];

  @IsOptional()
  settings?: any;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}