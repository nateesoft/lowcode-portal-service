import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NodeContent } from '../../entities/node-content.entity';
import { NodeContentHistory } from '../../entities/node-content-history.entity';

@Injectable()
export class NodeContentService {
  constructor(
    @InjectRepository(NodeContent)
    private nodeContentRepository: Repository<NodeContent>,
    @InjectRepository(NodeContentHistory)
    private nodeContentHistoryRepository: Repository<NodeContentHistory>,
  ) {}

  async findByFlowId(flowId: number): Promise<NodeContent[]> {
    return this.nodeContentRepository.find({ 
      where: { flow: { id: flowId } },
      relations: ['createdBy', 'updatedBy', 'flow']
    });
  }

  async findByNodeId(flowId: number, nodeId: string): Promise<NodeContent | null> {
    return this.nodeContentRepository.findOne({ 
      where: { flow: { id: flowId }, nodeId },
      relations: ['createdBy', 'updatedBy', 'flow']
    });
  }

  async createOrUpdate(flowId: number, nodeId: string, contentData: {
    label: string;
    description?: string;
    content: string;
    language: string;
    nodeType: string;
    metadata?: any;
    changeDescription?: string;
  }, userId?: number): Promise<NodeContent> {
    
    // Check if node content already exists
    let nodeContent = await this.findByNodeId(flowId, nodeId);
    let isNewVersion = false;

    if (nodeContent) {
      // Check if content has actually changed
      if (nodeContent.content !== contentData.content || 
          nodeContent.language !== contentData.language) {
        
        // Save current version to history before updating
        await this.saveToHistory(nodeContent, contentData.changeDescription || 'Content updated', userId);
        
        // Increment version
        const currentVersion = nodeContent.version;
        const versionParts = currentVersion.split('.').map(Number);
        versionParts[2]++; // Increment patch version
        nodeContent.version = versionParts.join('.');
        isNewVersion = true;
      }

      // Update existing content
      nodeContent.label = contentData.label;
      nodeContent.description = contentData.description || nodeContent.description;
      nodeContent.content = contentData.content;
      nodeContent.language = contentData.language;
      nodeContent.metadata = { ...nodeContent.metadata, ...contentData.metadata };
      
      if (userId) {
        nodeContent.updatedBy = { id: userId } as any;
      }
    } else {
      // Create new node content
      nodeContent = this.nodeContentRepository.create({
        nodeId,
        label: contentData.label,
        description: contentData.description,
        content: contentData.content,
        language: contentData.language,
        version: '1.0.0',
        nodeType: contentData.nodeType,
        metadata: contentData.metadata,
        flow: { id: flowId } as any,
        createdBy: userId ? { id: userId } as any : undefined,
        updatedBy: userId ? { id: userId } as any : undefined,
      });
      isNewVersion = true;
    }

    const savedContent = await this.nodeContentRepository.save(nodeContent);

    // If this is a new version, save initial history entry for new content
    if (isNewVersion && !await this.hasHistory(savedContent.id)) {
      await this.saveToHistory(savedContent, 'Initial version', userId);
    }

    return savedContent;
  }

  private async hasHistory(nodeContentId: number): Promise<boolean> {
    const count = await this.nodeContentHistoryRepository.count({
      where: { nodeContent: { id: nodeContentId } }
    });
    return count > 0;
  }

  private async saveToHistory(nodeContent: NodeContent, changeDescription: string, userId?: number): Promise<NodeContentHistory> {
    const history = this.nodeContentHistoryRepository.create({
      content: nodeContent.content,
      language: nodeContent.language,
      version: nodeContent.version,
      changeDescription,
      metadata: nodeContent.metadata,
      nodeContent: { id: nodeContent.id } as any,
      createdBy: userId ? { id: userId } as any : undefined,
    });

    return this.nodeContentHistoryRepository.save(history);
  }

  async getHistory(flowId: number, nodeId: string): Promise<NodeContentHistory[]> {
    const nodeContent = await this.findByNodeId(flowId, nodeId);
    if (!nodeContent) {
      throw new NotFoundException('Node content not found');
    }

    return this.nodeContentHistoryRepository.find({
      where: { nodeContent: { id: nodeContent.id } },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' }
    });
  }

  async getVersionContent(flowId: number, nodeId: string, version: string): Promise<NodeContentHistory | null> {
    const nodeContent = await this.findByNodeId(flowId, nodeId);
    if (!nodeContent) {
      throw new NotFoundException('Node content not found');
    }

    return this.nodeContentHistoryRepository.findOne({
      where: { 
        nodeContent: { id: nodeContent.id }, 
        version 
      },
      relations: ['createdBy']
    });
  }

  async delete(flowId: number, nodeId: string): Promise<void> {
    const nodeContent = await this.findByNodeId(flowId, nodeId);
    if (!nodeContent) {
      throw new NotFoundException('Node content not found');
    }

    await this.nodeContentRepository.remove(nodeContent);
  }

  async deleteHistory(historyId: number): Promise<void> {
    const history = await this.nodeContentHistoryRepository.findOne({ where: { id: historyId } });
    if (!history) {
      throw new NotFoundException('History entry not found');
    }

    await this.nodeContentHistoryRepository.remove(history);
  }
}