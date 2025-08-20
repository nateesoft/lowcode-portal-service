import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DatabaseConnection } from './database-connection.entity';
import { User } from './user.entity';

@Entity('database_queries')
@Index(['createdBy', 'connectionId'])
@Index(['isFavorite'])
export class DatabaseQuery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column()
  connectionId: number;

  @Column({ type: 'text' })
  query: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: false })
  isFavorite: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastExecuted?: Date;

  @Column({ nullable: true })
  executionTime?: number; // in milliseconds

  @Column({ nullable: true })
  rowsAffected?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  createdBy: number;

  @ManyToOne(() => DatabaseConnection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'connectionId' })
  connection: DatabaseConnection;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  // Virtual fields
  get queryType(): string {
    const trimmedQuery = this.query.trim().toLowerCase();
    if (trimmedQuery.startsWith('select')) return 'SELECT';
    if (trimmedQuery.startsWith('insert')) return 'INSERT';
    if (trimmedQuery.startsWith('update')) return 'UPDATE';
    if (trimmedQuery.startsWith('delete')) return 'DELETE';
    if (trimmedQuery.startsWith('create')) return 'CREATE';
    if (trimmedQuery.startsWith('alter')) return 'ALTER';
    if (trimmedQuery.startsWith('drop')) return 'DROP';
    return 'OTHER';
  }

  get isReadOnly(): boolean {
    return this.queryType === 'SELECT';
  }

  get isDangerous(): boolean {
    return ['DELETE', 'DROP', 'ALTER'].includes(this.queryType);
  }
}