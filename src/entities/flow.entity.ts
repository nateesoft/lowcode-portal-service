import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { FlowHistory } from './flow-history.entity';

@Entity('flows')
export class Flow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('json', { nullable: true })
  configuration: any;

  @Column({ default: 'draft' })
  status: string;

  @Column({ default: '1.0.0' })
  version: string;

  @ManyToOne(() => User)
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => FlowHistory, history => history.flow)
  history: FlowHistory[];
}