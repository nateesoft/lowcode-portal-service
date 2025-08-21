import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaFile } from '../../entities/media-file.entity';
import { MediaFolder } from '../../entities/media-folder.entity';
import { User } from '../../entities/user.entity';
import { MinioService } from '../../services/minio.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaFile, MediaFolder, User]),
    ConfigModule,
  ],
  controllers: [MediaController],
  providers: [MediaService, MinioService],
  exports: [MediaService, MinioService],
})
export class MediaModule {}