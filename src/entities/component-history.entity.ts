import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Component } from './component.entity';
import { User } from './user.entity';

@Entity('component_history')
@Index(['componentId', 'version'])
@Index(['componentId', 'createdAt'])
export class ComponentHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'component_id' })
  componentId: string;

  @Column()
  version: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  type: string;

  @Column()
  category: string;

  @Column('json', { nullable: true })
  props: any;

  @Column('json', { nullable: true })
  styles: any;

  @Column('text', { nullable: true })
  template?: string;

  @Column('text', { nullable: true })
  code?: string;

  @Column()
  status: string;

  @Column({ name: 'is_public' })
  isPublic: boolean;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl?: string;

  @Column({ name: 'change_description', nullable: true })
  changeDescription?: string;

  @Column({ name: 'change_type', default: 'manual' })
  changeType: 'manual' | 'auto' | 'import' | 'restore';

  @Column('json', { name: 'metadata', nullable: true })
  metadata?: {
    propsCount?: number;
    stylesCount?: number;
    templateLines?: number;
    codeLines?: number;
    rollbackFrom?: string;
    importSource?: string;
    [key: string]: any;
  };

  @Column({ name: 'created_by' })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Component, component => component.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'component_id' })
  component: Component;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  user: User;
}