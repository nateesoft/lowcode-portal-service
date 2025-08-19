import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { MyProject } from './my-project.entity';

@Entity('user_groups')
export class UserGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, default: 'active' })
  status: string; // active, inactive, archived

  @Column({ type: 'json', nullable: true })
  permissions: string[];

  @Column({ type: 'json', nullable: true })
  settings: any;

  @Column({ nullable: true })
  color: string; // สำหรับแสดงผลใน UI

  @Column({ nullable: true })
  icon: string; // ไอคอนของกลุ่ม

  @Column({ default: false })
  isSystem: boolean; // กลุ่มระบบที่ไม่สามารถลบได้

  @Column()
  createdById: number;

  @Column({ nullable: true })
  projectId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @ManyToOne(() => MyProject, { nullable: true })
  @JoinColumn({ name: 'projectId' })
  project: MyProject;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'user_group_members',
    joinColumn: {
      name: 'userGroupId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  members: User[];
}