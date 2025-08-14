import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Flow } from './flow.entity';
import { User } from './user.entity';
import { NodeContentHistory } from './node-content-history.entity';

@Entity('node_contents')
export class NodeContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nodeId: string; // ID of the node within the flow

  @Column()
  label: string;

  @Column({ nullable: true })
  description: string;

  @Column('text')
  content: string; // The code/content

  @Column({ default: 'javascript' })
  language: string;

  @Column({ default: '1.0.0' })
  version: string;

  @Column()
  nodeType: string; // 'service' or 'flowchart'

  @Column('json', { nullable: true })
  metadata: any; // Additional node properties

  @ManyToOne(() => Flow, { onDelete: 'CASCADE' })
  flow: Flow;

  @ManyToOne(() => User)
  createdBy: User;

  @ManyToOne(() => User)
  updatedBy: User;

  @OneToMany(() => NodeContentHistory, history => history.nodeContent)
  history: NodeContentHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}