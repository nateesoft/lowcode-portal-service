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

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimary: boolean;
  isIndex: boolean;
  length?: number;
  comment?: string;
}

@Entity('database_tables')
@Index(['connectionId', 'name'])
export class DatabaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  connectionId: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  schema?: string;

  @Column({ type: 'json' })
  columns: DatabaseColumn[];

  @Column({ default: 0 })
  rowCount: number;

  @Column({ length: 50, nullable: true })
  size?: string;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => DatabaseConnection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'connectionId' })
  connection: DatabaseConnection;

  // Virtual fields
  get primaryKeyColumns(): DatabaseColumn[] {
    return this.columns.filter(col => col.isPrimary);
  }

  get indexedColumns(): DatabaseColumn[] {
    return this.columns.filter(col => col.isIndex);
  }

  get nonNullableColumns(): DatabaseColumn[] {
    return this.columns.filter(col => !col.nullable);
  }
}