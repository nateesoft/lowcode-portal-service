import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { MediaFileType } from '../../../entities/media-file.entity';

export class CreateMediaFileDto {
  @IsString()
  name: string;

  @IsString()
  originalName: string;

  @IsEnum(['image', 'video', 'audio', 'document', 'other'])
  type: MediaFileType;

  @IsString()
  mimeType: string;

  @IsString()
  minioPath: string;

  @IsString()
  bucketName: string;

  @IsOptional()
  @IsString()
  thumbnailPath?: string;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  folderId?: string;
}