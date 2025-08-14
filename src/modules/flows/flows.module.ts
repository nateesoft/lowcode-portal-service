import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flow } from '../../entities/flow.entity';
import { FlowsService } from './flows.service';
import { FlowsController } from './flows.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Flow])],
  providers: [FlowsService],
  controllers: [FlowsController],
  exports: [FlowsService],
})
export class FlowsModule {}