import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { MyProject, ProjectStatus, ProjectType, ProjectPriority } from '../../entities/my-project.entity';
import { WorkFlow } from '../../entities/work-flow.entity';
import { WorkFlowNode } from '../../entities/work-flow-node.entity';
import { WorkFlowHistory, ChangeType } from '../../entities/work-flow-history.entity';
import { CreateMyProjectDto } from './dto/create-my-project.dto';
import { CreateWorkFlowDto } from './dto/create-work-flow.dto';
import { CreateWorkFlowNodeDto } from './dto/create-work-flow-node.dto';

export interface MyProjectStats {
  total: number;
  byStatus: Array<{ status: ProjectStatus; count: number }>;
  byType: Array<{ projectType: ProjectType; count: number }>;
  byPriority: Array<{ priority: ProjectPriority; count: number }>;
  totalWorkflows: number;
  totalNodes: number;
  publicProjects: number;
  recentActivity: Array<{
    projectId: number;
    projectName: string;
    action: string;
    date: Date;
  }>;
}

export interface WorkFlowStats {
  total: number;
  active: number;
  draft: number;
  deployed: number;
  byType: Array<{ workflowType: string; count: number }>;
  totalNodes: number;
  avgNodesPerWorkflow: number;
  complexityDistribution: Array<{ complexity: string; count: number }>;
}

@Injectable()
export class MyProjectsService {
  constructor(
    @InjectRepository(MyProject)
    private readonly myProjectRepository: Repository<MyProject>,
    @InjectRepository(WorkFlow)
    private readonly workFlowRepository: Repository<WorkFlow>,
    @InjectRepository(WorkFlowNode)
    private readonly workFlowNodeRepository: Repository<WorkFlowNode>,
    @InjectRepository(WorkFlowHistory)
    private readonly workFlowHistoryRepository: Repository<WorkFlowHistory>,
  ) {}

  // ===== MY PROJECT METHODS =====

  async findAllProjects(
    status?: ProjectStatus,
    projectType?: ProjectType,
    priority?: ProjectPriority,
    isPublic?: boolean,
    search?: string,
  ): Promise<MyProject[]> {
    const queryBuilder = this.myProjectRepository.createQueryBuilder('project')
      .leftJoinAndSelect('project.createdBy', 'user')
      .leftJoinAndSelect('project.workflows', 'workflows')
      .orderBy('project.updatedAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('project.status = :status', { status });
    }

    if (projectType) {
      queryBuilder.andWhere('project.projectType = :projectType', { projectType });
    }

    if (priority) {
      queryBuilder.andWhere('project.priority = :priority', { priority });
    }

    if (isPublic !== undefined) {
      queryBuilder.andWhere('project.isPublic = :isPublic', { isPublic });
    }

    if (search) {
      queryBuilder.andWhere(
        '(project.name ILIKE :search OR project.description ILIKE :search OR project.tags::text ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    return queryBuilder.getMany();
  }

  async findProjectById(id: number): Promise<MyProject> {
    const project = await this.myProjectRepository.findOne({
      where: { id },
      relations: ['createdBy', 'workflows', 'workflows.nodes', 'workflows.history'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async findProjectBySlug(slug: string): Promise<MyProject> {
    const project = await this.myProjectRepository.findOne({
      where: { slug },
      relations: ['createdBy', 'workflows', 'workflows.nodes'],
    });

    if (!project) {
      throw new NotFoundException(`Project with slug ${slug} not found`);
    }

    return project;
  }

  async createProject(createProjectDto: CreateMyProjectDto, userId: number): Promise<MyProject> {
    // Check if slug already exists
    const existingProject = await this.myProjectRepository.findOne({
      where: { slug: createProjectDto.slug },
    });

    if (existingProject) {
      throw new BadRequestException(`Project with slug ${createProjectDto.slug} already exists`);
    }

    const project = this.myProjectRepository.create({
      ...createProjectDto,
      createdById: userId,
    });

    return this.myProjectRepository.save(project);
  }

  async updateProject(
    id: number,
    updateData: Partial<CreateMyProjectDto>,
    userId?: number,
  ): Promise<MyProject> {
    const project = await this.findProjectById(id);

    // Check slug uniqueness if being updated
    if (updateData.slug && updateData.slug !== project.slug) {
      const existingProject = await this.myProjectRepository.findOne({
        where: { slug: updateData.slug },
      });

      if (existingProject) {
        throw new BadRequestException(`Project with slug ${updateData.slug} already exists`);
      }
    }

    Object.assign(project, updateData);
    
    return this.myProjectRepository.save(project);
  }

  async deleteProject(id: number): Promise<void> {
    const project = await this.findProjectById(id);
    await this.myProjectRepository.remove(project);
  }

  async getProjectStats(): Promise<MyProjectStats> {
    const [
      total,
      statusCounts,
      typeCounts,
      priorityCounts,
      publicCount,
      totalWorkflows,
      totalNodes,
      recentProjects
    ] = await Promise.all([
      this.myProjectRepository.count(),
      this.myProjectRepository
        .createQueryBuilder('project')
        .select('project.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('project.status')
        .getRawMany(),
      this.myProjectRepository
        .createQueryBuilder('project')
        .select('project.projectType', 'projectType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('project.projectType')
        .getRawMany(),
      this.myProjectRepository
        .createQueryBuilder('project')
        .select('project.priority', 'priority')
        .addSelect('COUNT(*)', 'count')
        .groupBy('project.priority')
        .getRawMany(),
      this.myProjectRepository.count({ where: { isPublic: true } }),
      this.workFlowRepository.count(),
      this.workFlowNodeRepository.count(),
      this.myProjectRepository.find({
        select: ['id', 'name', 'updatedAt'],
        order: { updatedAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      total,
      byStatus: statusCounts.map(item => ({
        status: item.status,
        count: parseInt(item.count),
      })),
      byType: typeCounts.map(item => ({
        projectType: item.projectType,
        count: parseInt(item.count),
      })),
      byPriority: priorityCounts.map(item => ({
        priority: item.priority,
        count: parseInt(item.count),
      })),
      totalWorkflows,
      totalNodes,
      publicProjects: publicCount,
      recentActivity: recentProjects.map(project => ({
        projectId: project.id,
        projectName: project.name,
        action: 'updated',
        date: project.updatedAt,
      })),
    };
  }

  // ===== WORKFLOW METHODS =====

  async findProjectWorkflows(projectId: number): Promise<WorkFlow[]> {
    return this.workFlowRepository.find({
      where: { projectId },
      relations: ['createdBy', 'nodes', 'project'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findWorkflowById(id: number): Promise<WorkFlow> {
    const workflow = await this.workFlowRepository.findOne({
      where: { id },
      relations: ['createdBy', 'nodes', 'project', 'history'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return workflow;
  }

  async createWorkflow(
    projectId: number,
    createWorkflowDto: CreateWorkFlowDto,
    userId: number,
  ): Promise<WorkFlow> {
    // Verify project exists
    await this.findProjectById(projectId);

    const workflow = this.workFlowRepository.create({
      ...createWorkflowDto,
      projectId,
      createdById: userId,
    });

    const savedWorkflow = await this.workFlowRepository.save(workflow);

    // Create initial history entry
    await this.createWorkflowHistoryEntry({
      workflowId: savedWorkflow.id,
      version: savedWorkflow.version,
      name: savedWorkflow.name,
      description: savedWorkflow.description,
      workflowType: savedWorkflow.workflowType,
      status: savedWorkflow.status,
      isActive: savedWorkflow.isActive,
      configuration: savedWorkflow.configuration,
      canvasData: savedWorkflow.canvasData,
      variables: savedWorkflow.variables,
      permissions: savedWorkflow.permissions,
      tags: savedWorkflow.tags,
      changeDescription: 'Initial workflow creation',
      changeType: ChangeType.MANUAL,
      metadata: {
        nodeCount: 0,
        edgeCount: 0,
        complexity: 'simple',
      },
    }, userId);

    return savedWorkflow;
  }

  async updateWorkflow(
    id: number,
    updateData: Partial<CreateWorkFlowDto>,
    userId?: number,
    changeDescription?: string,
  ): Promise<WorkFlow> {
    const workflow = await this.findWorkflowById(id);

    // Create history entry before updating
    if (userId) {
      await this.createWorkflowHistoryEntry({
        workflowId: id,
        version: this.generateNextVersion(workflow.version),
        name: updateData.name || workflow.name,
        description: updateData.description || workflow.description,
        workflowType: updateData.workflowType || workflow.workflowType,
        status: updateData.status || workflow.status,
        isActive: updateData.isActive !== undefined ? updateData.isActive : workflow.isActive,
        configuration: updateData.configuration || workflow.configuration,
        canvasData: updateData.canvasData || workflow.canvasData,
        variables: updateData.variables || workflow.variables,
        permissions: updateData.permissions || workflow.permissions,
        tags: updateData.tags || workflow.tags,
        changeDescription: changeDescription || 'Workflow updated',
        changeType: ChangeType.MANUAL,
        metadata: this.calculateWorkflowMetadata(updateData.canvasData || workflow.canvasData),
      }, userId);
    }

    Object.assign(workflow, updateData);
    
    if (updateData.canvasData) {
      workflow.metadata = {
        ...workflow.metadata,
        ...this.calculateWorkflowMetadata(updateData.canvasData),
        lastExecuted: new Date().toISOString(),
      };
    }

    return this.workFlowRepository.save(workflow);
  }

  async deleteWorkflow(id: number): Promise<void> {
    const workflow = await this.findWorkflowById(id);
    await this.workFlowRepository.remove(workflow);
  }

  async getWorkflowStats(projectId?: number): Promise<WorkFlowStats> {
    const queryBuilder = this.workFlowRepository.createQueryBuilder('workflow');
    
    if (projectId) {
      queryBuilder.where('workflow.projectId = :projectId', { projectId });
    }

    const [
      total,
      active,
      draft,
      deployed,
      typeStats,
      totalNodes,
      complexityStats
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.clone().andWhere('workflow.status = :status', { status: 'active' }).getCount(),
      queryBuilder.clone().andWhere('workflow.status = :status', { status: 'draft' }).getCount(),
      queryBuilder.clone().andWhere('workflow.status = :status', { status: 'deployed' }).getCount(),
      queryBuilder.clone()
        .select('workflow.workflowType', 'workflowType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('workflow.workflowType')
        .getRawMany(),
      this.workFlowNodeRepository.count(),
      queryBuilder.clone()
        .select('workflow.metadata->>\'complexity\'', 'complexity')
        .addSelect('COUNT(*)', 'count')
        .groupBy('workflow.metadata->>\'complexity\'')
        .getRawMany(),
    ]);

    return {
      total,
      active,
      draft,
      deployed,
      byType: typeStats.map(item => ({
        workflowType: item.workflowType,
        count: parseInt(item.count),
      })),
      totalNodes,
      avgNodesPerWorkflow: total > 0 ? Math.round(totalNodes / total * 100) / 100 : 0,
      complexityDistribution: complexityStats.map(item => ({
        complexity: item.complexity || 'simple',
        count: parseInt(item.count),
      })),
    };
  }

  // ===== WORKFLOW NODE METHODS =====

  async findWorkflowNodes(workflowId: number): Promise<WorkFlowNode[]> {
    return this.workFlowNodeRepository.find({
      where: { workflowId },
      relations: ['createdBy', 'workflow', 'linkedPage', 'linkedComponent'],
      order: { createdAt: 'ASC' },
    });
  }

  async createWorkflowNode(
    workflowId: number,
    createNodeDto: CreateWorkFlowNodeDto,
    userId: number,
  ): Promise<WorkFlowNode> {
    // Verify workflow exists
    await this.findWorkflowById(workflowId);

    const node = this.workFlowNodeRepository.create({
      ...createNodeDto,
      workflowId,
      createdById: userId,
    });

    return this.workFlowNodeRepository.save(node);
  }

  async updateWorkflowNode(
    id: number,
    updateData: Partial<CreateWorkFlowNodeDto>,
  ): Promise<WorkFlowNode> {
    const node = await this.workFlowNodeRepository.findOne({
      where: { id },
      relations: ['workflow'],
    });

    if (!node) {
      throw new NotFoundException(`Workflow node with ID ${id} not found`);
    }

    Object.assign(node, updateData);
    return this.workFlowNodeRepository.save(node);
  }

  async deleteWorkflowNode(id: number): Promise<void> {
    const node = await this.workFlowNodeRepository.findOne({ where: { id } });
    if (!node) {
      throw new NotFoundException(`Workflow node with ID ${id} not found`);
    }
    await this.workFlowNodeRepository.remove(node);
  }

  // ===== WORKFLOW HISTORY METHODS =====

  async getWorkflowHistory(workflowId: number): Promise<WorkFlowHistory[]> {
    return this.workFlowHistoryRepository.find({
      where: { workflowId: workflowId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async restoreWorkflowFromHistory(
    workflowId: number,
    version: string,
    userId: number,
  ): Promise<WorkFlow> {
    const historyEntry = await this.workFlowHistoryRepository.findOne({
      where: { workflowId: workflowId, version },
    });

    if (!historyEntry) {
      throw new NotFoundException(`History entry for workflow ${workflowId} version ${version} not found`);
    }

    const workflow = await this.findWorkflowById(workflowId);

    // Create history entry for current state before restoring
    await this.createWorkflowHistoryEntry({
      workflowId: workflowId,
      version: this.generateNextVersion(workflow.version),
      name: workflow.name,
      description: workflow.description,
      workflowType: workflow.workflowType,
      status: workflow.status,
      isActive: workflow.isActive,
      configuration: workflow.configuration,
      canvasData: workflow.canvasData,
      variables: workflow.variables,
      permissions: workflow.permissions,
      tags: workflow.tags,
      changeDescription: `Restored from version ${version}`,
      changeType: ChangeType.RESTORE,
      metadata: {
        ...this.calculateWorkflowMetadata(workflow.canvasData),
        rollbackFrom: workflow.version,
      },
    }, userId);

    // Restore workflow data
    Object.assign(workflow, {
      name: historyEntry.name,
      description: historyEntry.description,
      workflowType: historyEntry.workflowType,
      status: historyEntry.status,
      isActive: historyEntry.isActive,
      configuration: historyEntry.configuration,
      canvasData: historyEntry.canvasData,
      variables: historyEntry.variables,
      permissions: historyEntry.permissions,
      tags: historyEntry.tags,
      version: this.generateNextVersion(workflow.version),
    });

    return this.workFlowRepository.save(workflow);
  }

  async deleteWorkflowHistoryEntry(historyId: number): Promise<void> {
    const historyEntry = await this.workFlowHistoryRepository.findOne({ where: { id: historyId } });
    if (!historyEntry) {
      throw new NotFoundException(`History entry with ID ${historyId} not found`);
    }
    await this.workFlowHistoryRepository.remove(historyEntry);
  }

  // ===== PRIVATE HELPER METHODS =====

  private async createWorkflowHistoryEntry(
    historyData: Partial<WorkFlowHistory>,
    userId: number,
  ): Promise<WorkFlowHistory> {
    const historyEntry = this.workFlowHistoryRepository.create({
      ...historyData,
      createdBy: userId,
    });

    return this.workFlowHistoryRepository.save(historyEntry);
  }

  private generateNextVersion(currentVersion: string): string {
    const versionParts = currentVersion.split('.');
    const major = parseInt(versionParts[0]);
    const minor = parseInt(versionParts[1]);
    const patch = parseInt(versionParts[2]) + 1;
    
    return `${major}.${minor}.${patch}`;
  }

  private calculateWorkflowMetadata(canvasData: any): any {
    if (!canvasData) {
      return {
        nodeCount: 0,
        edgeCount: 0,
        complexity: 'simple',
      };
    }

    const nodeCount = canvasData.nodes?.length || 0;
    const edgeCount = canvasData.edges?.length || 0;
    
    let complexity = 'simple';
    if (nodeCount > 10 || edgeCount > 15) {
      complexity = 'complex';
    } else if (nodeCount > 5 || edgeCount > 8) {
      complexity = 'medium';
    }

    return {
      nodeCount,
      edgeCount,
      complexity,
      canvasSize: JSON.stringify(canvasData).length,
    };
  }
}