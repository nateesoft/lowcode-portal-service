import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaFile, MediaFileType, MediaMetadata } from '../../entities/media-file.entity';
import { MediaFolder } from '../../entities/media-folder.entity';
import { User } from '../../entities/user.entity';
import { MinioService } from '../../services/minio.service';
import { CreateMediaFileDto } from './dto/create-media-file.dto';
import { CreateMediaFolderDto } from './dto/create-media-folder.dto';
import { UpdateMediaFileDto } from './dto/update-media-file.dto';
import * as sharp from 'sharp';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(MediaFile)
    private mediaFileRepository: Repository<MediaFile>,
    @InjectRepository(MediaFolder)
    private mediaFolderRepository: Repository<MediaFolder>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private minioService: MinioService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    folderId?: string,
  ): Promise<MediaFile> {
    try {
      // Validate file
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      // Find user for relation
      const user = await this.userRepository.findOne({ where: { id: parseInt(userId) } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Determine file type
      const fileType = this.getFileType(file.mimetype);
      
      // Upload to MinIO
      const filePath = await this.minioService.uploadFile(
        file.originalname,
        file.buffer,
        file.mimetype
      );

      // Generate thumbnail for images
      let thumbnailPath: string | undefined;
      if (fileType === 'image') {
        try {
          const thumbnail = await this.generateImageThumbnail(file.buffer);
          thumbnailPath = await this.minioService.uploadThumbnail(
            file.originalname,
            thumbnail,
            'image/jpeg'
          );
        } catch (error) {
          this.logger.warn(`Failed to generate thumbnail: ${error.message}`);
        }
      }

      // Extract metadata
      const metadata = await this.extractMetadata(file.buffer, fileType);

      // Create database record
      const mediaFileDto: CreateMediaFileDto = {
        name: file.originalname,
        originalName: file.originalname,
        type: fileType,
        mimeType: file.mimetype,
        minioPath: filePath,
        bucketName: this.minioService.getBucketName(),
        thumbnailPath,
        metadata,
        tags: [],
        folderId,
      };

      const mediaFile = this.mediaFileRepository.create({
        ...mediaFileDto,
        size: file.size,
        uploader: user,
      });

      const savedFile = await this.mediaFileRepository.save(mediaFile);

      // Add URL after saving
      savedFile.url = this.minioService.getPublicFileUrl(savedFile.minioPath);
      if (savedFile.thumbnailPath) {
        savedFile.thumbnailUrl = this.minioService.getPublicFileUrl(savedFile.thumbnailPath);
      }

      return savedFile;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }

  async findAllFiles(userId: string, folderId?: string): Promise<MediaFile[]> {
    const query = this.mediaFileRepository.createQueryBuilder('file')
      .leftJoinAndSelect('file.uploader', 'uploader')
      .where('uploader.id = :userId', { userId: parseInt(userId) });

    if (folderId) {
      query.andWhere('file.folderId = :folderId', { folderId });
    } else {
      query.andWhere('file.folderId IS NULL');
    }

    const files = await query
      .orderBy('file.createdAt', 'DESC')
      .getMany();

    // Add URLs to files
    files.forEach(file => {
      file.url = this.minioService.getPublicFileUrl(file.minioPath);
      if (file.thumbnailPath) {
        file.thumbnailUrl = this.minioService.getPublicFileUrl(file.thumbnailPath);
      }
    });

    return files;
  }

  async findFileById(id: string, userId: string): Promise<MediaFile> {
    const file = await this.mediaFileRepository.findOne({
      where: { 
        id, 
        uploader: { id: parseInt(userId) }
      },
      relations: ['uploader']
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Add URLs
    file.url = this.minioService.getPublicFileUrl(file.minioPath);
    if (file.thumbnailPath) {
      file.thumbnailUrl = this.minioService.getPublicFileUrl(file.thumbnailPath);
    }

    return file;
  }

  async updateFile(id: string, userId: string, updateData: UpdateMediaFileDto): Promise<MediaFile> {
    const file = await this.findFileById(id, userId);
    
    const updatedFile = await this.mediaFileRepository.save({
      ...file,
      ...updateData,
    });

    return updatedFile;
  }

  async deleteFile(id: string, userId: string): Promise<void> {
    const file = await this.findFileById(id, userId);

    // Delete from MinIO
    await this.minioService.deleteFile(file.minioPath);
    if (file.thumbnailPath) {
      await this.minioService.deleteFile(file.thumbnailPath);
    }

    // Delete from database
    await this.mediaFileRepository.delete(id);
  }

  async createFolder(createFolderDto: CreateMediaFolderDto, userId: string): Promise<MediaFolder> {
    const folder = this.mediaFolderRepository.create({
      ...createFolderDto,
      createdBy: userId,
    });

    return await this.mediaFolderRepository.save(folder);
  }

  async findAllFolders(userId: string, parentId?: string): Promise<MediaFolder[]> {
    const query = this.mediaFolderRepository.createQueryBuilder('folder')
      .leftJoinAndSelect('folder.files', 'files')
      .where('folder.createdBy = :userId', { userId });

    if (parentId) {
      query.andWhere('folder.parentId = :parentId', { parentId });
    } else {
      query.andWhere('folder.parentId IS NULL');
    }

    return await query
      .orderBy('folder.createdAt', 'ASC')
      .getMany();
  }

  async findFolderById(id: string, userId: string): Promise<MediaFolder> {
    const folder = await this.mediaFolderRepository.findOne({
      where: { id, createdBy: userId },
      relations: ['files', 'children'],
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  async deleteFolder(id: string, userId: string): Promise<void> {
    const folder = await this.findFolderById(id, userId);

    // Delete all files in folder
    if (folder.files && folder.files.length > 0) {
      for (const file of folder.files) {
        await this.deleteFile(file.id, userId);
      }
    }

    // Recursively delete subfolders
    if (folder.children && folder.children.length > 0) {
      for (const childFolder of folder.children) {
        await this.deleteFolder(childFolder.id, userId);
      }
    }

    await this.mediaFolderRepository.delete(id);
  }

  private getFileType(mimeType: string): MediaFileType {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    return 'other';
  }

  private async extractMetadata(buffer: Buffer, fileType: MediaFileType): Promise<MediaMetadata> {
    if (fileType === 'image') {
      try {
        const metadata = await sharp(buffer).metadata();
        return {
          width: metadata.width,
          height: metadata.height,
          colorSpace: metadata.space,
          orientation: metadata.orientation,
        };
      } catch (error) {
        this.logger.warn(`Failed to extract image metadata: ${error.message}`);
      }
    }

    return {};
  }

  private async generateImageThumbnail(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
      .resize(200, 200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
}