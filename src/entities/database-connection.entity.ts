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

export enum DatabaseType {
  MYSQL = 'mysql',
  POSTGRESQL = 'postgresql',
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  TESTING = 'testing',
  ERROR = 'error',
}

@Entity('database_connections')
@Index(['createdBy', 'isActive'])
export class DatabaseConnection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: DatabaseType,
  })
  type: DatabaseType;

  @Column({ length: 255 })
  host: string;

  @Column()
  port: number;

  @Column({ length: 255 })
  database: string;

  @Column({ length: 255 })
  username: string;

  @Column({ select: false }) // Hide in default queries for security
  encryptedPassword: string;

  @Column({
    type: 'enum',
    enum: ConnectionStatus,
    default: ConnectionStatus.DISCONNECTED,
  })
  status: ConnectionStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastConnected?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastTested?: Date;

  @Column({ type: 'text', nullable: true })
  lastError?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  connectionConfig?: any; // Additional connection parameters

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  createdBy: number;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  // Virtual fields
  get connectionString(): string {
    switch (this.type) {
      case DatabaseType.MYSQL:
        return `mysql://${this.username}:***@${this.host}:${this.port}/${this.database}`;
      case DatabaseType.POSTGRESQL:
        return `postgresql://${this.username}:***@${this.host}:${this.port}/${this.database}`;
      default:
        return `${this.type}://${this.host}:${this.port}/${this.database}`;
    }
  }

  get isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED;
  }

  get needsReconnection(): boolean {
    return this.status === ConnectionStatus.ERROR || 
           (this.lastConnected ? new Date().getTime() - this.lastConnected.getTime() > 24 * 60 * 60 * 1000 : false); // 24 hours
  }
}