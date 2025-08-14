import { Injectable } from '@nestjs/common';
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
}