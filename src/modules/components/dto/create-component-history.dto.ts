import { IsString, IsOptional, IsIn, IsObject, IsBoolean, IsArray } from 'class-validator';

export class CreateComponentHistoryDto {
  @IsString()
  componentId: string;

  @IsString()
  version: string;

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

  @IsString()
  status: string;

  @IsBoolean()
  isPublic: boolean;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  changeDescription?: string;

  @IsOptional()
  @IsIn(['manual', 'auto', 'import', 'restore'])
  changeType?: 'manual' | 'auto' | 'import' | 'restore';

  @IsOptional()
  @IsObject()
  metadata?: {
    propsCount?: number;
    stylesCount?: number;
    templateLines?: number;
    codeLines?: number;
    rollbackFrom?: string;
    importSource?: string;
    [key: string]: any;
  };
}