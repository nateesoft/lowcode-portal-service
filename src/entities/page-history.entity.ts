import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Page } from './page.entity';

@Entity('page_history')
@Index(['pageId', 'version'])
@Index(['pageId', 'createdAt'])
export class PageHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'page_id' })
  pageId: string;

  @Column()
  version: string;

  @Column()
  title: string;

  @Column()
  slug: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('json', { nullable: true })
  content?: any; // Page content structure

  @Column('json', { nullable: true })
  layout?: any; // Page layout configuration

  @Column('json', { nullable: true })
  components?: any; // Components used in the page

  @Column('json', { nullable: true })
  styles?: any; // Page-specific styles

  @Column('text', { nullable: true })
  customCSS?: string; // Custom CSS code

  @Column('text', { nullable: true })
  customJS?: string; // Custom JavaScript code

  @Column()
  status: string; // draft, published, archived

  @Column({ name: 'is_public' })
  isPublic: boolean;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl?: string;

  @Column({ name: 'seo_title', nullable: true })
  seoTitle?: string;

  @Column({ name: 'seo_description', nullable: true })
  seoDescription?: string;

  @Column('simple-array', { name: 'seo_keywords', nullable: true })
  seoKeywords?: string[];

  @Column({ name: 'page_type' })
  pageType: string; // standard, landing, blog, product, etc.

  @Column({ name: 'route_path', nullable: true })
  routePath?: string; // Frontend route path

  @Column('text', { name: 'change_description', nullable: true })
  changeDescription?: string;

  @Column({ name: 'change_type', default: 'manual' })
  changeType: 'manual' | 'auto' | 'import' | 'restore';

  @Column('json', { name: 'metadata', nullable: true })
  metadata?: {
    contentSize?: number;
    componentCount?: number;
    styleRulesCount?: number;
    customCSSLines?: number;
    customJSLines?: number;
    seoScore?: number;
    rollbackFrom?: string;
  };

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  user?: User;

  @Column({ name: 'created_by' })
  createdBy: number;

  @ManyToOne(() => Page, page => page.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page: Page;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}