import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ComponentsService } from './components.service';
import { CreateComponentDto } from './dto/create-component.dto';
import { CreateComponentHistoryDto } from './dto/create-component-history.dto';

@Controller('components')
export class ComponentsController {
  constructor(private readonly componentsService: ComponentsService) {}

  @Post()
  create(@Body() createComponentDto: CreateComponentDto) {
    return this.componentsService.create(createComponentDto);
  }

  @Get()
  findAll(@Query('category') category?: string, @Query('public') isPublic?: string) {
    if (isPublic === 'true') {
      return this.componentsService.findPublicComponents();
    }
    if (category) {
      return this.componentsService.findByCategory(category);
    }
    return this.componentsService.findAll();
  }

  @Get('stats')
  getComponentStats() {
    return this.componentsService.getComponentStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.componentsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateComponentDto: Partial<CreateComponentDto> & { userId?: number; changeDescription?: string }
  ) {
    const { userId, changeDescription, ...updateData } = updateComponentDto;
    return this.componentsService.update(+id, updateData, userId, changeDescription);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.componentsService.remove(+id);
  }

  // Component History Endpoints
  @Get(':id/history')
  getComponentHistory(@Param('id') id: string) {
    return this.componentsService.getComponentHistory(+id);
  }

  @Get(':id/history/:version')
  getHistoryVersion(@Param('id') id: string, @Param('version') version: string) {
    return this.componentsService.getHistoryVersion(+id, version);
  }

  @Post(':id/history')
  createHistoryEntry(
    @Param('id') id: string,
    @Body() historyData: CreateComponentHistoryDto,
    @Query('userId') userId: number
  ) {
    return this.componentsService.createHistoryEntry(historyData, userId);
  }

  @Post(':id/restore/:version')
  restoreFromHistory(
    @Param('id') id: string,
    @Param('version') version: string,
    @Body() body: { userId: number }
  ) {
    return this.componentsService.restoreFromHistory(+id, version, body.userId);
  }

  @Delete(':id/history/:historyId')
  deleteHistoryEntry(@Param('historyId') historyId: string) {
    return this.componentsService.deleteHistoryEntry(+historyId);
  }
}