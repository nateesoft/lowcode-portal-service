import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { User } from './user.entity';
import { WorkFlow } from './work-flow.entity';

export enum ProjectStatus {
  PLANNING = 'planning',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  PRODUCTION = 'production',
  MAINTENANCE = 'maintenance',
  ARCHIVED = 'archived'
}

export enum ProjectType {
  WEB = 'web',
  MOBILE = 'mobile',
  API = 'api',
  DESKTOP = 'desktop',
  DASHBOARD = 'dashboard',
  ECOMMERCE = 'ecommerce',
  BLOG = 'blog',
  PORTFOLIO = 'portfolio',
  OTHER = 'other'
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('my_projects')
@Index(['slug'], { unique: true })
@Index(['status'])
@Index(['projectType'])
@Index(['priority'])
@Index(['isPublic'])
export class MyProject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ name: 'project_type', default: 'web' })
  projectType: ProjectType;

  @Column({ default: 'planning' })
  status: ProjectStatus;

  @Column({ default: 'medium' })
  priority: ProjectPriority;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @Column({ default: '1.0.0' })
  version: string;

  // Project metadata
  @Column('json', { nullable: true })
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

  // Project configuration
  @Column('json', { nullable: true })
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

  // Design settings from modal
  @Column('json', { nullable: true, name: 'design_settings' })
  designSettings?: {
    primaryFont?: string;
    customFont?: string;
    colorTheme?: string;
    multiLanguage?: boolean;
    authProvider?: string;
    alertTemplate?: string;
    datePickerStyle?: string;
  };

  // Project assets and resources
  @Column('json', { nullable: true })
  assets?: {
    logo?: string;
    favicon?: string;
    images?: string[];
    documents?: string[];
    mockups?: string[];
    prototypes?: string[];
  };

  // Tags for categorization
  @Column('simple-array', { nullable: true })
  tags?: string[];

  // Thumbnail for project preview
  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl?: string;

  // SEO and Social Media
  @Column({ name: 'seo_title', nullable: true })
  seoTitle?: string;

  @Column({ name: 'seo_description', nullable: true })
  seoDescription?: string;

  @Column('simple-array', { nullable: true, name: 'seo_keywords' })
  seoKeywords?: string[];

  @Column({ name: 'social_image', nullable: true })
  socialImage?: string;

  // Relations
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by' })
  createdById: number;

  @OneToMany(() => WorkFlow, workflow => workflow.project, { cascade: true })
  workflows: WorkFlow[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}