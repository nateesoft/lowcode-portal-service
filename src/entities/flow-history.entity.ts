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
import { Flow } from './flow.entity';
import { User } from './user.entity';

@Entity('flow_history')
@Index(['flowId', 'version'])
@Index(['flowId', 'createdAt'])
export class FlowHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'flow_id' })
  flowId: string;

  @Column()
  version: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  status: string;

  @Column('json')
  configuration: any;

  @Column({ name: 'change_description', nullable: true })
  changeDescription?: string;

  @Column({ name: 'change_type', default: 'manual' })
  changeType: 'manual' | 'auto' | 'import' | 'restore';

  @Column('json', { name: 'metadata', nullable: true })
  metadata?: {
    nodeCount?: number;
    edgeCount?: number;
    tags?: string[];
    deployedAt?: string;
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
  @ManyToOne(() => Flow, flow => flow.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flow_id' })
  flow: Flow;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  user: User;
}