import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { PageHistory } from './page-history.entity';

@Entity('pages')
@Index(['slug'], { unique: true })
@Index(['status'])
@Index(['createdBy', 'updatedAt'])
export class Page {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ unique: true })
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

  @Column({ default: 'draft' })
  status: string; // draft, published, archived

  @Column({ default: '1.0.0' })
  version: string;

  @Column({ name: 'is_public', default: false })
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

  @Column({ name: 'page_type', default: 'standard' })
  pageType: string; // standard, landing, blog, product, etc.

  @Column({ name: 'route_path', nullable: true })
  routePath?: string; // Frontend route path

  @Column('json', { nullable: true })
  metadata?: any; // Additional metadata

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;

  @Column({ name: 'created_by', nullable: true })
  createdById?: number;

  @OneToMany(() => PageHistory, history => history.page)
  history: PageHistory[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}