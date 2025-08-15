import { IsString, IsOptional, IsObject, IsBoolean, IsArray, IsNumber } from 'class-validator';

export class CreatePageHistoryDto {
  @IsString()
  pageId: string;

  @IsString()
  version: string;

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
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsArray()
  seoKeywords?: string[];

  @IsString()
  pageType: string;

  @IsOptional()
  @IsString()
  routePath?: string;

  @IsOptional()
  @IsString()
  changeDescription?: string;

  @IsOptional()
  @IsString()
  changeType?: 'manual' | 'auto' | 'import' | 'restore';

  @IsOptional()
  @IsObject()
  metadata?: {
    contentSize?: number;
    componentCount?: number;
    styleRulesCount?: number;
    customCSSLines?: number;
    customJSLines?: number;
    seoScore?: number;
    rollbackFrom?: string;
  };

  @IsNumber()
  createdBy: number;
}