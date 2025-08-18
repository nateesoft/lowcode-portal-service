import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  nodes: any;

  @Column({ type: 'json', nullable: true })
  edges: any;

  @Column({ type: 'json', nullable: true })
  viewport: any;

  @Column({ length: 20, default: '1.0.0' })
  version: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ length: 50, default: 'REST_API' })
  serviceType: string;

  @Column({ type: 'text', nullable: true })
  changeDescription: string;

  @Column()
  createdBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}