import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flow } from '../../entities/flow.entity';
import { FlowHistory } from '../../entities/flow-history.entity';
import { CreateFlowHistoryDto } from './dto/create-flow-history.dto';

@Injectable()
export class FlowsService {
  constructor(
    @InjectRepository(Flow)
    private flowsRepository: Repository<Flow>,
    @InjectRepository(FlowHistory)
    private flowHistoryRepository: Repository<FlowHistory>,
  ) {}

  async findAll(): Promise<Flow[]> {
    return this.flowsRepository.find({ 
      relations: ['createdBy', 'history'],
      order: { updatedAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Flow | null> {
    return this.flowsRepository.findOne({ 
      where: { id }, 
      relations: ['createdBy', 'history'] 
    });
  }

  async create(flow: Partial<Flow>): Promise<Flow> {
    const newFlow = this.flowsRepository.create(flow);
    return this.flowsRepository.save(newFlow);
  }

  async update(id: number, updateData: Partial<Flow>, userId?: number, changeDescription?: string): Promise<Flow | null> {
    // Get current flow data before update for history
    const currentFlow = await this.findOne(id);
    if (!currentFlow) {
      throw new NotFoundException('Flow not found');
    }

    // Create history entry before updating
    if (userId) {
      await this.createHistoryEntry({
        flowId: id.toString(),
        version: this.generateNextVersion(currentFlow.version),
        name: currentFlow.name,
        description: currentFlow.description,
        status: currentFlow.status,
        configuration: currentFlow.configuration,
        changeDescription: changeDescription || 'Flow updated',
        changeType: 'manual',
        metadata: {
          nodeCount: currentFlow.configuration?.nodes?.length || 0,
          edgeCount: currentFlow.configuration?.edges?.length || 0,
        }
      }, userId);
    }

    // Update the flow
    await this.flowsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.flowsRepository.delete(id);
  }

  async execute(id: number, executionData?: any): Promise<any> {
    const flow = await this.findOne(id);
    if (!flow) {
      throw new NotFoundException('Flow not found');
    }

    if (flow.status !== 'active') {
      throw new BadRequestException('Flow is not active');
    }

    console.log(`Executing flow: ${flow.name}`);
    console.log('Flow configuration:', flow.configuration);

    // Simple flow execution simulation
    const execution = {
      flowId: id,
      flowName: flow.name,
      status: 'completed',
      executedAt: new Date().toISOString(),
      input: executionData || {},
      output: {
        message: `Flow "${flow.name}" executed successfully`,
        nodesProcessed: flow.configuration?.nodes?.length || 0,
        executionTime: Math.round(Math.random() * 1000) + 500, // Simulate execution time
        results: this.simulateFlowExecution(flow.configuration)
      }
    };

    console.log('Execution result:', execution);
    return execution;
  }

  private simulateFlowExecution(configuration: any): any {
    if (!configuration?.nodes) {
      return { message: 'No nodes to process' };
    }

    const results = configuration.nodes.map((node: any) => ({
      nodeId: node.id,
      nodeLabel: node.data.label,
      nodeType: node.type,
      status: 'completed',
      executedAt: new Date().toISOString(),
      output: node.data.code ? 'Code executed successfully' : 'Node processed'
    }));

    return {
      totalNodes: configuration.nodes.length,
      processedNodes: results.length,
      nodeResults: results
    };
  }

  // Flow History Methods
  async getFlowHistory(flowId: number): Promise<FlowHistory[]> {
    return this.flowHistoryRepository.find({
      where: { flowId: flowId.toString() },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  async getHistoryVersion(flowId: number, version: string): Promise<FlowHistory | null> {
    return this.flowHistoryRepository.findOne({
      where: { flowId: flowId.toString(), version },
      relations: ['user']
    });
  }

  async createHistoryEntry(historyData: CreateFlowHistoryDto, userId: number): Promise<FlowHistory> {
    const history = this.flowHistoryRepository.create({
      ...historyData,
      createdBy: userId
    });
    return this.flowHistoryRepository.save(history);
  }

  async restoreFromHistory(flowId: number, version: string, userId: number): Promise<Flow | null> {
    const historyVersion = await this.getHistoryVersion(flowId, version);
    if (!historyVersion) {
      throw new NotFoundException('History version not found');
    }

    // Create a history entry for the current state before restore
    const currentFlow = await this.findOne(flowId);
    if (currentFlow) {
      await this.createHistoryEntry({
        flowId: flowId.toString(),
        version: this.generateNextVersion(currentFlow.version),
        name: currentFlow.name,
        description: currentFlow.description,
        status: currentFlow.status,
        configuration: currentFlow.configuration,
        changeDescription: `Restored from version ${version}`,
        changeType: 'restore',
        metadata: {
          rollbackFrom: currentFlow.version,
          nodeCount: currentFlow.configuration?.nodes?.length || 0,
          edgeCount: currentFlow.configuration?.edges?.length || 0,
        }
      }, userId);
    }

    // Restore the flow from history
    const restoreData = {
      name: historyVersion.name,
      description: historyVersion.description,
      configuration: historyVersion.configuration,
      status: historyVersion.status,
      version: this.generateNextVersion(currentFlow?.version || '1.0.0')
    };

    return this.update(flowId, restoreData, userId, `Restored from version ${version}`);
  }

  async deleteHistoryEntry(historyId: number): Promise<void> {
    await this.flowHistoryRepository.delete(historyId);
  }

  private generateNextVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const major = parseInt(parts[0] || '1', 10);
    const minor = parseInt(parts[1] || '0', 10);
    const patch = parseInt(parts[2] || '0', 10);
    
    return `${major}.${minor}.${patch + 1}`;
  }
}