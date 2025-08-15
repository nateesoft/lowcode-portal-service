import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { CreatePageHistoryDto } from './dto/create-page-history.dto';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Post()
  create(@Body() createPageDto: CreatePageDto) {
    return this.pagesService.create(createPageDto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('pageType') pageType?: string,
    @Query('public') isPublic?: string
  ) {
    if (isPublic === 'true') {
      return this.pagesService.findPublicPages();
    }
    if (status) {
      return this.pagesService.findByStatus(status);
    }
    if (pageType) {
      return this.pagesService.findByPageType(pageType);
    }
    return this.pagesService.findAll();
  }

  @Get('stats')
  getPageStats() {
    return this.pagesService.getPageStats();
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.pagesService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePageDto: Partial<CreatePageDto> & { userId?: number; changeDescription?: string }
  ) {
    const { userId, changeDescription, ...updateData } = updatePageDto;
    return this.pagesService.update(+id, updateData, userId, changeDescription);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pagesService.remove(+id);
  }

  // Page History Endpoints
  @Get(':id/history')
  getPageHistory(@Param('id') id: string) {
    return this.pagesService.getPageHistory(+id);
  }

  @Get(':id/history/:version')
  getHistoryVersion(@Param('id') id: string, @Param('version') version: string) {
    return this.pagesService.getHistoryVersion(+id, version);
  }

  @Post(':id/history')
  createHistoryEntry(
    @Param('id') id: string,
    @Body() historyData: CreatePageHistoryDto,
    @Query('userId') userId: number
  ) {
    return this.pagesService.createHistoryEntry(historyData);
  }

  @Post(':id/restore/:version')
  restoreFromHistory(
    @Param('id') id: string,
    @Param('version') version: string,
    @Body() body: { userId: number }
  ) {
    return this.pagesService.restoreFromHistory(+id, version, body.userId);
  }

  @Delete(':id/history/:historyId')
  deleteHistoryEntry(@Param('historyId') historyId: string) {
    return this.pagesService.deleteHistoryEntry(+historyId);
  }
}