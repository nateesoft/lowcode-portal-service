import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { MediaFolder } from './media-folder.entity';

export type MediaFileType = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  frameRate?: number;
  bitrate?: number;
  colorSpace?: string;
  orientation?: number;
}

@Entity('media_files')
export class MediaFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'enum', enum: ['image', 'video', 'audio', 'document', 'other'] })
  type: MediaFileType;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ type: 'varchar', length: 500 })
  minioPath: string;

  @Column({ type: 'varchar', length: 500 })
  bucketName: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailPath?: string;

  // URLs are computed properties, not stored in database
  url?: string;
  thumbnailUrl?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: MediaMetadata;

  @Column({ type: 'json', default: '[]' })
  tags: string[];

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @Column({ type: 'uuid', nullable: true, name: 'folder_id' })
  folderId?: string;

  @ManyToOne(() => MediaFolder, folder => folder.files, { nullable: true })
  @JoinColumn({ name: 'folder_id' })
  folder?: MediaFolder;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}