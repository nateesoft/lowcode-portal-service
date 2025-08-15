import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyProjectsController } from './my-projects.controller';
import { MyProjectsService } from './my-projects.service';
import { MyProject } from '../../entities/my-project.entity';
import { WorkFlow } from '../../entities/work-flow.entity';
import { WorkFlowNode } from '../../entities/work-flow-node.entity';
import { WorkFlowHistory } from '../../entities/work-flow-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MyProject,
      WorkFlow,
      WorkFlowNode,
      WorkFlowHistory,
    ]),
  ],
  controllers: [MyProjectsController],
  providers: [MyProjectsService],
  exports: [MyProjectsService],
})
export class MyProjectsModule {}