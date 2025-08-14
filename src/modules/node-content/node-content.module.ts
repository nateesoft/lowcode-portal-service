import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodeContentController } from './node-content.controller';
import { NodeContentService } from './node-content.service';
import { NodeContent } from '../../entities/node-content.entity';
import { NodeContentHistory } from '../../entities/node-content-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NodeContent, NodeContentHistory])],
  controllers: [NodeContentController],
  providers: [NodeContentService],
  exports: [NodeContentService],
})
export class NodeContentModule {}