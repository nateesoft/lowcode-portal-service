import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flow } from '../../entities/flow.entity';

@Injectable()
export class FlowsService {
  constructor(
    @InjectRepository(Flow)
    private flowsRepository: Repository<Flow>,
  ) {}

  async findAll(): Promise<Flow[]> {
    return this.flowsRepository.find({ relations: ['createdBy'] });
  }

  async findOne(id: number): Promise<Flow | null> {
    return this.flowsRepository.findOne({ 
      where: { id }, 
      relations: ['createdBy'] 
    });
  }

  async create(flow: Partial<Flow>): Promise<Flow> {
    const newFlow = this.flowsRepository.create(flow);
    return this.flowsRepository.save(newFlow);
  }

  async update(id: number, updateData: Partial<Flow>): Promise<Flow | null> {
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
}