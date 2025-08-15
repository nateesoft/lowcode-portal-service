import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Component } from '../../entities/component.entity';
import { ComponentHistory } from '../../entities/component-history.entity';
import { CreateComponentDto } from './dto/create-component.dto';
import { CreateComponentHistoryDto } from './dto/create-component-history.dto';

@Injectable()
export class ComponentsService {
  constructor(
    @InjectRepository(Component)
    private componentsRepository: Repository<Component>,
    @InjectRepository(ComponentHistory)
    private componentHistoryRepository: Repository<ComponentHistory>,
  ) {}

  async findAll(): Promise<Component[]> {
    return this.componentsRepository.find({
      relations: ['createdBy', 'history'],
      order: { updatedAt: 'DESC' }
    });
  }

  async findByCategory(category: string): Promise<Component[]> {
    return this.componentsRepository.find({
      where: { category },
      relations: ['createdBy'],
      order: { updatedAt: 'DESC' }
    });
  }

  async findPublicComponents(): Promise<Component[]> {
    return this.componentsRepository.find({
      where: { isPublic: true, status: 'published' },
      relations: ['createdBy'],
      order: { updatedAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Component | null> {
    return this.componentsRepository.findOne({
      where: { id },
      relations: ['createdBy', 'history']
    });
  }

  async create(componentData: CreateComponentDto): Promise<Component> {
    const component = this.componentsRepository.create({
      ...componentData,
      status: componentData.status || 'draft',
      version: componentData.version || '1.0.0',
      isPublic: componentData.isPublic || false,
      createdBy: componentData.userId ? { id: componentData.userId } as any : undefined
    });

    const savedComponent = await this.componentsRepository.save(component);

    // Create initial history entry
    if (componentData.userId) {
      await this.createHistoryEntry({
        componentId: savedComponent.id.toString(),
        version: savedComponent.version,
        name: savedComponent.name,
        description: savedComponent.description,
        type: savedComponent.type,
        category: savedComponent.category,
        props: savedComponent.props,
        styles: savedComponent.styles,
        template: savedComponent.template,
        code: savedComponent.code,
        status: savedComponent.status,
        isPublic: savedComponent.isPublic,
        tags: savedComponent.tags,
        thumbnailUrl: savedComponent.thumbnailUrl,
        changeDescription: componentData.changeDescription || 'Component created',
        changeType: 'manual',
        metadata: {
          propsCount: Object.keys(savedComponent.props || {}).length,
          stylesCount: Object.keys(savedComponent.styles || {}).length,
          templateLines: savedComponent.template?.split('\n').length || 0,
          codeLines: savedComponent.code?.split('\n').length || 0,
        }
      }, componentData.userId);
    }

    return savedComponent;
  }

  async update(id: number, updateData: Partial<CreateComponentDto>, userId?: number, changeDescription?: string): Promise<Component | null> {
    // Get current component data before update for history
    const currentComponent = await this.findOne(id);
    if (!currentComponent) {
      throw new NotFoundException('Component not found');
    }

    // Create history entry before updating
    if (userId) {
      await this.createHistoryEntry({
        componentId: id.toString(),
        version: this.generateNextVersion(currentComponent.version),
        name: currentComponent.name,
        description: currentComponent.description,
        type: currentComponent.type,
        category: currentComponent.category,
        props: currentComponent.props,
        styles: currentComponent.styles,
        template: currentComponent.template,
        code: currentComponent.code,
        status: currentComponent.status,
        isPublic: currentComponent.isPublic,
        tags: currentComponent.tags,
        thumbnailUrl: currentComponent.thumbnailUrl,
        changeDescription: changeDescription || 'Component updated',
        changeType: 'manual',
        metadata: {
          propsCount: Object.keys(currentComponent.props || {}).length,
          stylesCount: Object.keys(currentComponent.styles || {}).length,
          templateLines: currentComponent.template?.split('\n').length || 0,
          codeLines: currentComponent.code?.split('\n').length || 0,
        }
      }, userId);
    }

    // Update the component
    await this.componentsRepository.update(id, {
      ...updateData,
      version: this.generateNextVersion(currentComponent.version)
    });
    
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.componentsRepository.delete(id);
  }

  // Component History Methods
  async getComponentHistory(componentId: number): Promise<ComponentHistory[]> {
    return this.componentHistoryRepository.find({
      where: { componentId: componentId.toString() },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  async getHistoryVersion(componentId: number, version: string): Promise<ComponentHistory | null> {
    return this.componentHistoryRepository.findOne({
      where: { componentId: componentId.toString(), version },
      relations: ['user']
    });
  }

  async createHistoryEntry(historyData: CreateComponentHistoryDto, userId: number): Promise<ComponentHistory> {
    const history = this.componentHistoryRepository.create({
      ...historyData,
      createdBy: userId
    });
    return this.componentHistoryRepository.save(history);
  }

  async restoreFromHistory(componentId: number, version: string, userId: number): Promise<Component | null> {
    const historyVersion = await this.getHistoryVersion(componentId, version);
    if (!historyVersion) {
      throw new NotFoundException('History version not found');
    }

    // Get current component for backup
    const currentComponent = await this.findOne(componentId);
    if (currentComponent) {
      // Create history entry for current state before restore
      await this.createHistoryEntry({
        componentId: componentId.toString(),
        version: this.generateNextVersion(currentComponent.version),
        name: currentComponent.name,
        description: currentComponent.description,
        type: currentComponent.type,
        category: currentComponent.category,
        props: currentComponent.props,
        styles: currentComponent.styles,
        template: currentComponent.template,
        code: currentComponent.code,
        status: currentComponent.status,
        isPublic: currentComponent.isPublic,
        tags: currentComponent.tags,
        thumbnailUrl: currentComponent.thumbnailUrl,
        changeDescription: `Restored from version ${version}`,
        changeType: 'restore',
        metadata: {
          rollbackFrom: currentComponent.version,
          propsCount: Object.keys(currentComponent.props || {}).length,
          stylesCount: Object.keys(currentComponent.styles || {}).length,
          templateLines: currentComponent.template?.split('\n').length || 0,
          codeLines: currentComponent.code?.split('\n').length || 0,
        }
      }, userId);
    }

    // Restore the component from history
    const restoreData = {
      name: historyVersion.name,
      description: historyVersion.description,
      type: historyVersion.type,
      category: historyVersion.category,
      props: historyVersion.props,
      styles: historyVersion.styles,
      template: historyVersion.template,
      code: historyVersion.code,
      status: historyVersion.status,
      isPublic: historyVersion.isPublic,
      tags: historyVersion.tags,
      thumbnailUrl: historyVersion.thumbnailUrl,
      version: this.generateNextVersion(currentComponent?.version || '1.0.0')
    };

    return this.update(componentId, restoreData, userId, `Restored from version ${version}`);
  }

  async deleteHistoryEntry(historyId: number): Promise<void> {
    await this.componentHistoryRepository.delete(historyId);
  }

  private generateNextVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const major = parseInt(parts[0] || '1', 10);
    const minor = parseInt(parts[1] || '0', 10);
    const patch = parseInt(parts[2] || '0', 10);
    
    return `${major}.${minor}.${patch + 1}`;
  }

  // Additional utility methods for dashboard
  async getComponentStats(): Promise<any> {
    const total = await this.componentsRepository.count();
    const published = await this.componentsRepository.count({ where: { status: 'published' } });
    const draft = await this.componentsRepository.count({ where: { status: 'draft' } });
    const publicComponents = await this.componentsRepository.count({ where: { isPublic: true } });

    const categoryCounts = await this.componentsRepository
      .createQueryBuilder('component')
      .select('component.category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('component.category')
      .getRawMany();

    return {
      total,
      published,
      draft,
      publicComponents,
      categories: categoryCounts.map(item => ({
        category: item.component_category,
        count: parseInt(item.count)
      }))
    };
  }
}