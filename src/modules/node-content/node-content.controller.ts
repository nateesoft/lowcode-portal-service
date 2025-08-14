import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { NodeContentService } from './node-content.service';

export interface CreateNodeContentDto {
  label: string;
  description?: string;
  content: string;
  language: string;
  nodeType: string;
  metadata?: any;
  changeDescription?: string;
}

@Controller('flows/:flowId/nodes')
export class NodeContentController {
  constructor(private readonly nodeContentService: NodeContentService) {}

  @Get()
  async getFlowNodeContents(@Param('flowId') flowId: string) {
    return this.nodeContentService.findByFlowId(+flowId);
  }

  @Get(':nodeId')
  async getNodeContent(@Param('flowId') flowId: string, @Param('nodeId') nodeId: string) {
    return this.nodeContentService.findByNodeId(+flowId, nodeId);
  }

  @Post(':nodeId')
  async createNodeContent(
    @Param('flowId') flowId: string,
    @Param('nodeId') nodeId: string,
    @Body() createDto: CreateNodeContentDto
  ) {
    return this.nodeContentService.createOrUpdate(+flowId, nodeId, createDto);
  }

  @Put(':nodeId')
  async updateNodeContent(
    @Param('flowId') flowId: string,
    @Param('nodeId') nodeId: string,
    @Body() updateDto: CreateNodeContentDto
  ) {
    return this.nodeContentService.createOrUpdate(+flowId, nodeId, updateDto);
  }

  @Delete(':nodeId')
  async deleteNodeContent(@Param('flowId') flowId: string, @Param('nodeId') nodeId: string) {
    await this.nodeContentService.delete(+flowId, nodeId);
    return { message: 'Node content deleted successfully' };
  }

  @Get(':nodeId/history')
  async getNodeContentHistory(@Param('flowId') flowId: string, @Param('nodeId') nodeId: string) {
    return this.nodeContentService.getHistory(+flowId, nodeId);
  }

  @Get(':nodeId/history/:version')
  async getNodeContentVersion(
    @Param('flowId') flowId: string,
    @Param('nodeId') nodeId: string,
    @Param('version') version: string
  ) {
    return this.nodeContentService.getVersionContent(+flowId, nodeId, version);
  }

  @Delete('history/:historyId')
  async deleteHistoryEntry(@Param('historyId') historyId: string) {
    await this.nodeContentService.deleteHistory(+historyId);
    return { message: 'History entry deleted successfully' };
  }
}