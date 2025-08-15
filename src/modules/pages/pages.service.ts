import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../entities/page.entity';
import { PageHistory } from '../../entities/page-history.entity';
import { CreatePageDto } from './dto/create-page.dto';
import { CreatePageHistoryDto } from './dto/create-page-history.dto';

@Injectable()
export class PagesService {
  constructor(
    @InjectRepository(Page)
    private pagesRepository: Repository<Page>,
    @InjectRepository(PageHistory)
    private pageHistoryRepository: Repository<PageHistory>,
  ) {}

  async findAll(): Promise<Page[]> {
    return this.pagesRepository.find({
      relations: ['createdBy', 'history'],
      order: { updatedAt: 'DESC' }
    });
  }

  async findByStatus(status: string): Promise<Page[]> {
    return this.pagesRepository.find({
      where: { status },
      relations: ['createdBy'],
      order: { updatedAt: 'DESC' }
    });
  }

  async findByPageType(pageType: string): Promise<Page[]> {
    return this.pagesRepository.find({
      where: { pageType },
      relations: ['createdBy'],
      order: { updatedAt: 'DESC' }
    });
  }

  async findPublicPages(): Promise<Page[]> {
    return this.pagesRepository.find({
      where: { isPublic: true, status: 'published' },
      relations: ['createdBy'],
      order: { updatedAt: 'DESC' }
    });
  }

  async findBySlug(slug: string): Promise<Page | null> {
    return this.pagesRepository.findOne({
      where: { slug },
      relations: ['createdBy', 'history']
    });
  }

  async findOne(id: number): Promise<Page | null> {
    return this.pagesRepository.findOne({
      where: { id },
      relations: ['createdBy', 'history']
    });
  }

  async create(pageData: CreatePageDto): Promise<Page> {
    // Check if slug already exists
    const existingPage = await this.pagesRepository.findOne({
      where: { slug: pageData.slug }
    });

    if (existingPage) {
      throw new BadRequestException(`Page with slug '${pageData.slug}' already exists`);
    }

    const page = this.pagesRepository.create({
      ...pageData,
      status: pageData.status || 'draft',
      version: pageData.version || '1.0.0',
      isPublic: pageData.isPublic || false,
      pageType: pageData.pageType || 'standard',
      createdById: pageData.userId || undefined
    });

    const savedPage = await this.pagesRepository.save(page);

    // Create initial history entry
    if (pageData.userId) {
      await this.createHistoryEntry({
        pageId: savedPage.id.toString(),
        version: savedPage.version,
        title: savedPage.title,
        slug: savedPage.slug,
        description: savedPage.description,
        content: savedPage.content,
        layout: savedPage.layout,
        components: savedPage.components,
        styles: savedPage.styles,
        customCSS: savedPage.customCSS,
        customJS: savedPage.customJS,
        status: savedPage.status,
        isPublic: savedPage.isPublic,
        tags: savedPage.tags,
        thumbnailUrl: savedPage.thumbnailUrl,
        seoTitle: savedPage.seoTitle,
        seoDescription: savedPage.seoDescription,
        seoKeywords: savedPage.seoKeywords,
        pageType: savedPage.pageType,
        routePath: savedPage.routePath,
        changeDescription: pageData.changeDescription || 'Page created',
        changeType: 'manual',
        metadata: {
          contentSize: JSON.stringify(savedPage.content || {}).length,
          componentCount: Object.keys(savedPage.components || {}).length,
          styleRulesCount: Object.keys(savedPage.styles || {}).length,
          customCSSLines: savedPage.customCSS?.split('\n').length || 0,
          customJSLines: savedPage.customJS?.split('\n').length || 0,
        },
        createdBy: pageData.userId
      });
    }

    return savedPage;
  }

  async update(id: number, updateData: Partial<CreatePageDto>, userId?: number, changeDescription?: string): Promise<Page | null> {
    // Get current page data before update for history
    const currentPage = await this.findOne(id);
    if (!currentPage) {
      throw new NotFoundException('Page not found');
    }

    // Check if slug already exists (if slug is being updated)
    if (updateData.slug && updateData.slug !== currentPage.slug) {
      const existingPage = await this.pagesRepository.findOne({
        where: { slug: updateData.slug }
      });

      if (existingPage) {
        throw new BadRequestException(`Page with slug '${updateData.slug}' already exists`);
      }
    }

    // Create history entry before updating
    if (userId) {
      await this.createHistoryEntry({
        pageId: id.toString(),
        version: this.generateNextVersion(currentPage.version),
        title: currentPage.title,
        slug: currentPage.slug,
        description: currentPage.description,
        content: currentPage.content,
        layout: currentPage.layout,
        components: currentPage.components,
        styles: currentPage.styles,
        customCSS: currentPage.customCSS,
        customJS: currentPage.customJS,
        status: currentPage.status,
        isPublic: currentPage.isPublic,
        tags: currentPage.tags,
        thumbnailUrl: currentPage.thumbnailUrl,
        seoTitle: currentPage.seoTitle,
        seoDescription: currentPage.seoDescription,
        seoKeywords: currentPage.seoKeywords,
        pageType: currentPage.pageType,
        routePath: currentPage.routePath,
        changeDescription: changeDescription || 'Page updated',
        changeType: 'manual',
        metadata: {
          contentSize: JSON.stringify(currentPage.content || {}).length,
          componentCount: Object.keys(currentPage.components || {}).length,
          styleRulesCount: Object.keys(currentPage.styles || {}).length,
          customCSSLines: currentPage.customCSS?.split('\n').length || 0,
          customJSLines: currentPage.customJS?.split('\n').length || 0,
        },
        createdBy: userId
      });
    }

    // Update the page
    await this.pagesRepository.update(id, {
      ...updateData,
      version: this.generateNextVersion(currentPage.version)
    });
    
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.pagesRepository.delete(id);
  }

  // Page History Methods
  async getPageHistory(pageId: number): Promise<PageHistory[]> {
    return this.pageHistoryRepository.find({
      where: { pageId: pageId.toString() },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  async getHistoryVersion(pageId: number, version: string): Promise<PageHistory | null> {
    return this.pageHistoryRepository.findOne({
      where: { pageId: pageId.toString(), version },
      relations: ['user']
    });
  }

  async createHistoryEntry(historyData: CreatePageHistoryDto): Promise<PageHistory> {
    const history = this.pageHistoryRepository.create(historyData);
    return this.pageHistoryRepository.save(history);
  }

  async restoreFromHistory(pageId: number, version: string, userId: number): Promise<Page | null> {
    const historyVersion = await this.getHistoryVersion(pageId, version);
    if (!historyVersion) {
      throw new NotFoundException('History version not found');
    }

    // Get current page for backup
    const currentPage = await this.findOne(pageId);
    if (currentPage) {
      // Create history entry for current state before restore
      await this.createHistoryEntry({
        pageId: pageId.toString(),
        version: this.generateNextVersion(currentPage.version),
        title: currentPage.title,
        slug: currentPage.slug,
        description: currentPage.description,
        content: currentPage.content,
        layout: currentPage.layout,
        components: currentPage.components,
        styles: currentPage.styles,
        customCSS: currentPage.customCSS,
        customJS: currentPage.customJS,
        status: currentPage.status,
        isPublic: currentPage.isPublic,
        tags: currentPage.tags,
        thumbnailUrl: currentPage.thumbnailUrl,
        seoTitle: currentPage.seoTitle,
        seoDescription: currentPage.seoDescription,
        seoKeywords: currentPage.seoKeywords,
        pageType: currentPage.pageType,
        routePath: currentPage.routePath,
        changeDescription: `Restored from version ${version}`,
        changeType: 'restore',
        metadata: {
          rollbackFrom: currentPage.version,
          contentSize: JSON.stringify(currentPage.content || {}).length,
          componentCount: Object.keys(currentPage.components || {}).length,
          styleRulesCount: Object.keys(currentPage.styles || {}).length,
          customCSSLines: currentPage.customCSS?.split('\n').length || 0,
          customJSLines: currentPage.customJS?.split('\n').length || 0,
        },
        createdBy: userId
      });
    }

    // Restore the page from history
    const restoreData = {
      title: historyVersion.title,
      slug: historyVersion.slug,
      description: historyVersion.description,
      content: historyVersion.content,
      layout: historyVersion.layout,
      components: historyVersion.components,
      styles: historyVersion.styles,
      customCSS: historyVersion.customCSS,
      customJS: historyVersion.customJS,
      status: historyVersion.status,
      isPublic: historyVersion.isPublic,
      tags: historyVersion.tags,
      thumbnailUrl: historyVersion.thumbnailUrl,
      seoTitle: historyVersion.seoTitle,
      seoDescription: historyVersion.seoDescription,
      seoKeywords: historyVersion.seoKeywords,
      pageType: historyVersion.pageType,
      routePath: historyVersion.routePath,
      version: this.generateNextVersion(currentPage?.version || '1.0.0')
    };

    return this.update(pageId, restoreData, userId, `Restored from version ${version}`);
  }

  async deleteHistoryEntry(historyId: number): Promise<void> {
    await this.pageHistoryRepository.delete(historyId);
  }

  private generateNextVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const major = parseInt(parts[0] || '1', 10);
    const minor = parseInt(parts[1] || '0', 10);
    const patch = parseInt(parts[2] || '0', 10);
    
    return `${major}.${minor}.${patch + 1}`;
  }

  // Additional utility methods for dashboard
  async getPageStats(): Promise<any> {
    const total = await this.pagesRepository.count();
    const published = await this.pagesRepository.count({ where: { status: 'published' } });
    const draft = await this.pagesRepository.count({ where: { status: 'draft' } });
    const publicPages = await this.pagesRepository.count({ where: { isPublic: true } });

    const pageTypeCounts = await this.pagesRepository
      .createQueryBuilder('page')
      .select('page.pageType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('page.pageType')
      .getRawMany();

    const statusCounts = await this.pagesRepository
      .createQueryBuilder('page')
      .select('page.status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('page.status')
      .getRawMany();

    return {
      total,
      published,
      draft,
      publicPages,
      pageTypes: pageTypeCounts.map(item => ({
        pageType: item.page_pageType,
        count: parseInt(item.count)
      })),
      statuses: statusCounts.map(item => ({
        status: item.page_status,
        count: parseInt(item.count)
      }))
    };
  }
}