import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MediaService } from './media.service';
import { CreateMediaFolderDto } from './dto/create-media-folder.dto';
import { UpdateMediaFileDto } from './dto/update-media-file.dto';

@Controller('media')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
    },
    fileFilter: (req, file, callback) => {
      // Accept all file types for now
      callback(null, true);
    },
  }))
  async uploadFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body('folderId') folderId: string,
    @Req() req: any,
  ) {
    const userId = '16'; // Hardcoded for testing
    const uploadedFiles: any[] = [];

    for (const file of files) {
      const uploadedFile = await this.mediaService.uploadFile(file, userId, folderId);
      uploadedFiles.push(uploadedFile);
    }

    return {
      success: true,
      data: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
    };
  }

  @Get('files')
  async getFiles(
    @Query('folderId') folderId: string,
    @Req() req: any,
  ) {
    const userId = '16'; // Hardcoded for testing
    const files = await this.mediaService.findAllFiles(userId, folderId);

    return {
      success: true,
      data: files,
    };
  }

  @Get('files/:id')
  async getFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const userId = '16'; // Hardcoded for testing
    const file = await this.mediaService.findFileById(id, userId);

    return {
      success: true,
      data: file,
    };
  }

  @Put('files/:id')
  async updateFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: UpdateMediaFileDto,
    @Req() req: any,
  ) {
    const userId = '16'; // Hardcoded for testing
    const file = await this.mediaService.updateFile(id, userId, updateData);

    return {
      success: true,
      data: file,
      message: 'File updated successfully',
    };
  }

  @Delete('files/:id')
  async deleteFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const userId = '16'; // Hardcoded for testing
    await this.mediaService.deleteFile(id, userId);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  @Delete('files')
  async deleteFiles(
    @Body('fileIds') fileIds: string[],
    @Req() req: any,
  ) {
    const userId = '16'; // Hardcoded for testing
    
    for (const fileId of fileIds) {
      await this.mediaService.deleteFile(fileId, userId);
    }

    return {
      success: true,
      message: `${fileIds.length} file(s) deleted successfully`,
    };
  }

  @Post('folders')
  async createFolder(
    @Body() createFolderDto: CreateMediaFolderDto,
    @Req() req: any,
  ) {
    const userId = '16'; // Hardcoded for testing
    const folder = await this.mediaService.createFolder(createFolderDto, userId);

    return {
      success: true,
      data: folder,
      message: 'Folder created successfully',
    };
  }

  @Get('folders')
  async getFolders(
    @Query('parentId') parentId: string,
    @Req() req: any,
  ) {
    const userId = '16'; // Hardcoded for testing
    const folders = await this.mediaService.findAllFolders(userId, parentId);

    return {
      success: true,
      data: folders,
    };
  }

  @Get('folders/:id')
  async getFolder(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const userId = '16'; // Hardcoded for testing
    const folder = await this.mediaService.findFolderById(id, userId);

    return {
      success: true,
      data: folder,
    };
  }

  @Delete('folders/:id')
  async deleteFolder(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const userId = '16'; // Hardcoded for testing
    await this.mediaService.deleteFolder(id, userId);

    return {
      success: true,
      message: 'Folder deleted successfully',
    };
  }

  @Put('files/:id/move')
  async moveFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('folderId') folderId: string,
    @Req() req: any,
  ) {
    const userId = '16'; // Hardcoded for testing
    const file = await this.mediaService.updateFile(id, userId, { folderId });

    return {
      success: true,
      data: file,
      message: 'File moved successfully',
    };
  }

  @Put('files/move')
  async moveFiles(
    @Body('fileIds') fileIds: string[],
    @Body('folderId') folderId: string,
    @Req() req: any,
  ) {
    const userId = '16'; // Hardcoded for testing
    const movedFiles: any[] = [];

    for (const fileId of fileIds) {
      const file = await this.mediaService.updateFile(fileId, userId, { folderId });
      movedFiles.push(file);
    }

    return {
      success: true,
      data: movedFiles,
      message: `${movedFiles.length} file(s) moved successfully`,
    };
  }

  @Put('files/:id/tags')
  async updateFileTags(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('tags') tags: string[],
    @Req() req: any,
  ) {
    const userId = '16'; // Hardcoded for testing
    const file = await this.mediaService.updateFile(id, userId, { tags });

    return {
      success: true,
      data: file,
      message: 'File tags updated successfully',
    };
  }

  @Put('files/:id/rename')
  async renameFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('name') name: string,
    @Req() req: any,
  ) {
    const userId = '16'; // Hardcoded for testing
    const file = await this.mediaService.updateFile(id, userId, { name });

    return {
      success: true,
      data: file,
      message: 'File renamed successfully',
    };
  }
}