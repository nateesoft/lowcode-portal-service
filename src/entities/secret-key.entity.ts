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
import { User } from './user.entity';

export enum SecretKeyType {
  API_KEY = 'api_key',
  PASSWORD = 'password',
  CERTIFICATE = 'certificate',
  TOKEN = 'token',
}

@Entity('secret_keys')
@Index(['createdBy', 'type'])
@Index(['createdBy', 'isActive'])
@Index(['expiresAt'])
export class SecretKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text' })
  value: string;

  @Column({
    type: 'enum',
    enum: SecretKeyType,
    default: SecretKeyType.API_KEY,
  })
  type: SecretKeyType;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  metadata?: any;

  @Column({ type: 'text', nullable: true })
  rotationHistory?: string;

  @Column({ nullable: true })
  lastAccessedAt?: Date;

  @Column({ default: 0 })
  accessCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  createdBy: number;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  // Virtual fields for computed properties
  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  get isExpiringSoon(): boolean {
    if (!this.expiresAt) return false;
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    return this.expiresAt <= oneWeekFromNow && !this.isExpired;
  }

  get lastModified(): Date {
    return this.updatedAt || this.createdAt;
  }
}