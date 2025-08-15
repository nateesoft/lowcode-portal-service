import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsObject, IsNumber, MinLength, MaxLength, IsUrl } from 'class-validator';
import { ProjectStatus, ProjectType, ProjectPriority } from '../../../entities/my-project.entity';

export class CreateMyProjectDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsObject()
  metadata?: {
    estimatedHours?: number;
    completionPercentage?: number;
    budget?: number;
    currency?: string;
    startDate?: string;
    endDate?: string;
    deadline?: string;
    clientInfo?: {
      name?: string;
      email?: string;
      company?: string;
    };
    techStack?: string[];
    features?: string[];
    requirements?: string[];
    notes?: string;
  };

  @IsOptional()
  @IsObject()
  configuration?: {
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      backgroundColor?: string;
      fontFamily?: string;
    };
    settings?: {
      enableAnalytics?: boolean;
      enableSEO?: boolean;
      enablePWA?: boolean;
      enableSSR?: boolean;
      enableI18n?: boolean;
      supportedLanguages?: string[];
    };
    deployment?: {
      environment?: string;
      domain?: string;
      subdomain?: string;
      customDomain?: string;
      ssl?: boolean;
    };
  };

  @IsOptional()
  @IsObject()
  designSettings?: {
    primaryFont?: string;
    customFont?: string;
    colorTheme?: string;
    multiLanguage?: boolean;
    authProvider?: string;
    alertTemplate?: string;
    datePickerStyle?: string;
  };

  @IsOptional()
  @IsObject()
  assets?: {
    logo?: string;
    favicon?: string;
    images?: string[];
    documents?: string[];
    mockups?: string[];
    prototypes?: string[];
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  seoDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoKeywords?: string[];

  @IsOptional()
  @IsUrl()
  socialImage?: string;

  @IsOptional()
  @IsNumber()
  createdById?: number;
}