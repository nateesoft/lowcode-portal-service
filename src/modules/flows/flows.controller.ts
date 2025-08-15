import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FlowsService } from './flows.service';
import { Flow } from '../../entities/flow.entity';
import { CreateFlowHistoryDto } from './dto/create-flow-history.dto';

@Controller('flows')
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Post()
  create(@Body() createFlowDto: Partial<Flow>) {
    return this.flowsService.create(createFlowDto);
  }

  @Get()
  findAll() {
    return this.flowsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flowsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateFlowDto: Partial<Flow> & { userId?: number; changeDescription?: string }
  ) {
    const { userId, changeDescription, ...updateData } = updateFlowDto;
    return this.flowsService.update(+id, updateData, userId, changeDescription);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.flowsService.remove(+id);
  }

  @Post(':id/execute')
  execute(@Param('id') id: string, @Body() executionData?: any) {
    return this.flowsService.execute(+id, executionData);
  }

  // Flow History Endpoints
  @Get(':id/history')
  getFlowHistory(@Param('id') id: string) {
    return this.flowsService.getFlowHistory(+id);
  }

  @Get(':id/history/:version')
  getHistoryVersion(@Param('id') id: string, @Param('version') version: string) {
    return this.flowsService.getHistoryVersion(+id, version);
  }

  @Post(':id/history')
  createHistoryEntry(
    @Param('id') id: string,
    @Body() historyData: CreateFlowHistoryDto,
    @Query('userId') userId: number
  ) {
    return this.flowsService.createHistoryEntry(historyData, userId);
  }

  @Post(':id/restore/:version')
  restoreFromHistory(
    @Param('id') id: string,
    @Param('version') version: string,
    @Body() body: { userId: number }
  ) {
    return this.flowsService.restoreFromHistory(+id, version, body.userId);
  }

  @Delete(':id/history/:historyId')
  deleteHistoryEntry(@Param('historyId') historyId: string) {
    return this.flowsService.deleteHistoryEntry(+historyId);
  }
}