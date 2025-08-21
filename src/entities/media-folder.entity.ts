import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { MediaFile } from './media-file.entity';

@Entity('media_folders')
export class MediaFolder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'uuid', nullable: true, name: 'parent_id' })
  parentId?: string;

  @ManyToOne(() => MediaFolder, folder => folder.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: MediaFolder;

  @OneToMany(() => MediaFolder, folder => folder.parent)
  children: MediaFolder[];

  @OneToMany(() => MediaFile, file => file.folder)
  files: MediaFile[];

  @Column({ type: 'varchar', length: 20, nullable: true })
  color?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon?: string;

  @Column({ type: 'varchar' })
  createdBy: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}