import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { ComponentHistory } from './component-history.entity';

@Entity('components')
export class Component {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  type: string; // 'button', 'input', 'card', 'modal', etc.

  @Column()
  category: string; // 'form', 'layout', 'navigation', 'display', etc.

  @Column('json', { nullable: true })
  props: any; // Component properties/configuration

  @Column('json', { nullable: true })
  styles: any; // Component styling

  @Column('text', { nullable: true })
  template: string; // HTML/JSX template

  @Column('text', { nullable: true })
  code: string; // Component code/logic

  @Column({ default: 'draft' })
  status: string; // 'draft', 'published', 'deprecated'

  @Column({ default: '1.0.0' })
  version: string;

  @Column({ default: false })
  isPublic: boolean; // Whether component is publicly available

  @Column('simple-array', { nullable: true })
  tags: string[]; // Tags for categorization

  @Column({ nullable: true })
  thumbnailUrl: string; // Preview image URL

  @ManyToOne(() => User)
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => ComponentHistory, history => history.component)
  history: ComponentHistory[];
}