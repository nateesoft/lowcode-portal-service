import { IsString, IsOptional, IsObject, IsBoolean, IsArray } from 'class-validator';

export class CreatePageDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  content?: any;

  @IsOptional()
  @IsObject()
  layout?: any;

  @IsOptional()
  @IsObject()
  components?: any;

  @IsOptional()
  @IsObject()
  styles?: any;

  @IsOptional()
  @IsString()
  customCSS?: string;

  @IsOptional()
  @IsString()
  customJS?: string;

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

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsArray()
  seoKeywords?: string[];

  @IsOptional()
  @IsString()
  pageType?: string;

  @IsOptional()
  @IsString()
  routePath?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;

  // For history tracking
  @IsOptional()
  userId?: number;

  @IsOptional()
  @IsString()
  changeDescription?: string;
}