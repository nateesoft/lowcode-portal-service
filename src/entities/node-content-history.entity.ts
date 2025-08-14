import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { NodeContent } from './node-content.entity';
import { User } from './user.entity';

@Entity('node_content_histories')
export class NodeContentHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string; // The code/content at this version

  @Column()
  language: string;

  @Column()
  version: string;

  @Column({ nullable: true })
  changeDescription: string; // What was changed in this version

  @Column('json', { nullable: true })
  metadata: any; // Additional version-specific metadata

  @ManyToOne(() => NodeContent, nodeContent => nodeContent.history, { onDelete: 'CASCADE' })
  nodeContent: NodeContent;

  @ManyToOne(() => User)
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;
}