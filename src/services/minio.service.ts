import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private minioClient: Minio.Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME', 'media-files');
    
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get<string>('MINIO_PORT', '9000')),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'admin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'SuperStrongPassword123!'),
    });
  }

  async onModuleInit() {
    try {
      // Check if bucket exists, create if not
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName);
        this.logger.log(`Created bucket: ${this.bucketName}`);
        
        // Set bucket policy to allow public read access for files
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicReadGetObject',
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        
        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        this.logger.log(`Set public read policy for bucket: ${this.bucketName}`);
      } else {
        this.logger.log(`Bucket already exists: ${this.bucketName}`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize MinIO: ${error.message}`);
      throw error;
    }
  }

  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      // Generate unique file path
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${fileName}`;
      const filePath = `uploads/${uniqueFileName}`;

      const uploadMetadata = {
        'Content-Type': contentType,
        ...metadata,
      };

      await this.minioClient.putObject(
        this.bucketName,
        filePath,
        fileBuffer,
        fileBuffer.length,
        uploadMetadata
      );

      this.logger.log(`File uploaded successfully: ${filePath}`);
      return filePath;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }

  async uploadThumbnail(
    originalFileName: string,
    thumbnailBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const thumbnailPath = `thumbnails/${timestamp}-thumb-${originalFileName}`;

      await this.minioClient.putObject(
        this.bucketName,
        thumbnailPath,
        thumbnailBuffer,
        thumbnailBuffer.length,
        { 'Content-Type': contentType }
      );

      this.logger.log(`Thumbnail uploaded successfully: ${thumbnailPath}`);
      return thumbnailPath;
    } catch (error) {
      this.logger.error(`Failed to upload thumbnail: ${error.message}`);
      throw error;
    }
  }

  async getFileUrl(filePath: string, expirySeconds: number = 24 * 60 * 60): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        filePath,
        expirySeconds
      );
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate file URL: ${error.message}`);
      throw error;
    }
  }

  getPublicFileUrl(filePath: string): string {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.configService.get<string>('MINIO_PORT', '9000');
    const useSSL = this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
    
    const protocol = useSSL ? 'https' : 'http';
    const portSuffix = (useSSL && port === '443') || (!useSSL && port === '80') ? '' : `:${port}`;
    
    return `${protocol}://${endpoint}${portSuffix}/${this.bucketName}/${filePath}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, filePath);
      this.logger.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }
  }

  async getFileInfo(filePath: string): Promise<Minio.BucketItemStat> {
    try {
      const stat = await this.minioClient.statObject(this.bucketName, filePath);
      return stat;
    } catch (error) {
      this.logger.error(`Failed to get file info: ${error.message}`);
      throw error;
    }
  }

  async copyFile(sourceFilePath: string, destinationFilePath: string): Promise<void> {
    try {
      await this.minioClient.copyObject(
        this.bucketName,
        destinationFilePath,
        `/${this.bucketName}/${sourceFilePath}`
      );
      this.logger.log(`File copied successfully from ${sourceFilePath} to ${destinationFilePath}`);
    } catch (error) {
      this.logger.error(`Failed to copy file: ${error.message}`);
      throw error;
    }
  }

  getBucketName(): string {
    return this.bucketName;
  }
}