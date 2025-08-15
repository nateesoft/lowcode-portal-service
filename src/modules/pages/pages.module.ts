import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from '../../entities/page.entity';
import { PageHistory } from '../../entities/page-history.entity';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Page, PageHistory])],
  providers: [PagesService],
  controllers: [PagesController],
  exports: [PagesService],
})
export class PagesModule {}