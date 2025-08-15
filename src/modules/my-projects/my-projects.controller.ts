import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { MyProjectsService } from './my-projects.service';
import { CreateMyProjectDto } from './dto/create-my-project.dto';
import { CreateWorkFlowDto } from './dto/create-work-flow.dto';
import { CreateWorkFlowNodeDto } from './dto/create-work-flow-node.dto';
import { ProjectStatus, ProjectType, ProjectPriority } from '../../entities/my-project.entity';

@Controller('my-projects')
export class MyProjectsController {
  constructor(private readonly myProjectsService: MyProjectsService) {}

  // ===== MY PROJECT ENDPOINTS =====

  @Get()
  findAllProjects(
    @Query('status') status?: ProjectStatus,
    @Query('projectType') projectType?: ProjectType,
    @Query('priority') priority?: ProjectPriority,
    @Query('public') isPublic?: string,
    @Query('search') search?: string,
  ) {
    const isPublicBool = isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    return this.myProjectsService.findAllProjects(status, projectType, priority, isPublicBool, search);
  }

  @Get('stats')
  getProjectStats() {
    return this.myProjectsService.getProjectStats();
  }

  @Get('slug/:slug')
  findProjectBySlug(@Param('slug') slug: string) {
    return this.myProjectsService.findProjectBySlug(slug);
  }

  @Get(':id')
  findProjectById(@Param('id', ParseIntPipe) id: number) {
    return this.myProjectsService.findProjectById(id);
  }

  @Post()
  createProject(@Body() createProjectDto: CreateMyProjectDto) {
    const userId = createProjectDto.createdById || 1; // Default user ID
    return this.myProjectsService.createProject(createProjectDto, userId);
  }

  @Patch(':id')
  updateProject(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateMyProjectDto>,
  ) {
    const userId = updateData.createdById || 1;
    return this.myProjectsService.updateProject(id, updateData, userId);
  }

  @Delete(':id')
  deleteProject(@Param('id', ParseIntPipe) id: number) {
    return this.myProjectsService.deleteProject(id);
  }

  // ===== WORKFLOW ENDPOINTS =====

  @Get(':projectId/workflows')
  findProjectWorkflows(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.myProjectsService.findProjectWorkflows(projectId);
  }

  @Get('workflows/stats')
  getWorkflowStats(@Query('projectId') projectId?: string) {
    const projectIdNum = projectId ? parseInt(projectId) : undefined;
    return this.myProjectsService.getWorkflowStats(projectIdNum);
  }

  @Get('workflows/:id')
  findWorkflowById(@Param('id', ParseIntPipe) id: number) {
    return this.myProjectsService.findWorkflowById(id);
  }

  @Post(':projectId/workflows')
  createWorkflow(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createWorkflowDto: CreateWorkFlowDto,
  ) {
    const userId = createWorkflowDto.createdById || 1;
    return this.myProjectsService.createWorkflow(projectId, createWorkflowDto, userId);
  }

  @Patch('workflows/:id')
  updateWorkflow(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateWorkFlowDto> & { changeDescription?: string },
  ) {
    const { changeDescription, ...workflowData } = updateData;
    const userId = workflowData.createdById || 1;
    return this.myProjectsService.updateWorkflow(id, workflowData, userId, changeDescription);
  }

  @Delete('workflows/:id')
  deleteWorkflow(@Param('id', ParseIntPipe) id: number) {
    return this.myProjectsService.deleteWorkflow(id);
  }

  // ===== WORKFLOW NODE ENDPOINTS =====

  @Get('workflows/:workflowId/nodes')
  findWorkflowNodes(@Param('workflowId', ParseIntPipe) workflowId: number) {
    return this.myProjectsService.findWorkflowNodes(workflowId);
  }

  @Post('workflows/:workflowId/nodes')
  createWorkflowNode(
    @Param('workflowId', ParseIntPipe) workflowId: number,
    @Body() createNodeDto: CreateWorkFlowNodeDto,
  ) {
    const userId = createNodeDto.createdById || 1;
    return this.myProjectsService.createWorkflowNode(workflowId, createNodeDto, userId);
  }

  @Patch('nodes/:id')
  updateWorkflowNode(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateWorkFlowNodeDto>,
  ) {
    return this.myProjectsService.updateWorkflowNode(id, updateData);
  }

  @Delete('nodes/:id')
  deleteWorkflowNode(@Param('id', ParseIntPipe) id: number) {
    return this.myProjectsService.deleteWorkflowNode(id);
  }

  // ===== WORKFLOW HISTORY ENDPOINTS =====

  @Get('workflows/:workflowId/history')
  getWorkflowHistory(@Param('workflowId', ParseIntPipe) workflowId: number) {
    return this.myProjectsService.getWorkflowHistory(workflowId);
  }

  @Post('workflows/:workflowId/restore/:version')
  restoreWorkflowFromHistory(
    @Param('workflowId', ParseIntPipe) workflowId: number,
    @Param('version') version: string,
    @Body() body: { userId: number },
  ) {
    return this.myProjectsService.restoreWorkflowFromHistory(workflowId, version, body.userId);
  }

  @Delete('history/:historyId')
  deleteWorkflowHistoryEntry(@Param('historyId', ParseIntPipe) historyId: number) {
    return this.myProjectsService.deleteWorkflowHistoryEntry(historyId);
  }

  // ===== SPECIAL PROJECT ENDPOINTS =====

  @Post(':projectId/duplicate')
  async duplicateProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() body: { name: string; slug: string; userId: number },
  ) {
    // Get original project
    const originalProject = await this.myProjectsService.findProjectById(projectId);
    
    // Create new project with modified data
    const newProjectData: CreateMyProjectDto = {
      name: body.name,
      slug: body.slug,
      description: `${originalProject.description} (Copy)`,
      projectType: originalProject.projectType,
      status: ProjectStatus.PLANNING,
      priority: originalProject.priority,
      isPublic: false,
      metadata: originalProject.metadata,
      configuration: originalProject.configuration,
      assets: originalProject.assets,
      tags: originalProject.tags ? [...originalProject.tags, 'duplicate'] : ['duplicate'],
      seoTitle: originalProject.seoTitle,
      seoDescription: originalProject.seoDescription,
      seoKeywords: originalProject.seoKeywords,
      createdById: body.userId,
    };

    return this.myProjectsService.createProject(newProjectData, body.userId);
  }

  @Post('workflows/:workflowId/execute')
  async executeWorkflow(
    @Param('workflowId', ParseIntPipe) workflowId: number,
    @Body() body: { parameters?: Record<string, any>; userId: number },
  ) {
    // This would implement workflow execution logic
    // For now, just return a success response
    const workflow = await this.myProjectsService.findWorkflowById(workflowId);
    
    return {
      success: true,
      message: `Workflow "${workflow.name}" executed successfully`,
      executionId: `exec_${Date.now()}`,
      timestamp: new Date().toISOString(),
      parameters: body.parameters || {},
    };
  }

  @Get('workflows/:workflowId/validate')
  async validateWorkflow(@Param('workflowId', ParseIntPipe) workflowId: number) {
    const workflow = await this.myProjectsService.findWorkflowById(workflowId);
    const nodes = await this.myProjectsService.findWorkflowNodes(workflowId);
    
    // Basic validation logic
    const validations: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      nodeId: string | null;
    }> = [];
    
    // Check if workflow has at least one start node
    const startNodes = nodes.filter(node => node.nodeType === 'start');
    if (startNodes.length === 0) {
      validations.push({
        type: 'error',
        message: 'Workflow must have at least one start node',
        nodeId: null,
      });
    }
    
    // Check if workflow has at least one end node
    const endNodes = nodes.filter(node => node.nodeType === 'end');
    if (endNodes.length === 0) {
      validations.push({
        type: 'warning',
        message: 'Workflow should have at least one end node',
        nodeId: null,
      });
    }
    
    // Check for orphaned nodes (nodes without connections)
    const canvasData = workflow.canvasData;
    if (canvasData && canvasData.edges) {
      const connectedNodeIds = new Set();
      canvasData.edges.forEach(edge => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });
      
      nodes.forEach(node => {
        if (!connectedNodeIds.has(node.nodeId) && node.nodeType !== 'start' && node.nodeType !== 'end') {
          validations.push({
            type: 'warning',
            message: `Node "${node.name}" is not connected to any other nodes`,
            nodeId: node.nodeId,
          });
        }
      });
    }
    
    return {
      isValid: validations.filter(v => v.type === 'error').length === 0,
      validations,
      summary: {
        errors: validations.filter(v => v.type === 'error').length,
        warnings: validations.filter(v => v.type === 'warning').length,
        totalNodes: nodes.length,
        totalEdges: canvasData?.edges?.length || 0,
      },
    };
  }
}