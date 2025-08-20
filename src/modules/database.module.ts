import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseConnection } from '../entities/database-connection.entity';
import { DatabaseTable } from '../entities/database-table.entity';
import { DatabaseQuery } from '../entities/database-query.entity';

import { DatabaseService } from '../services/database.service';
import { DatabaseController } from '../controllers/database.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DatabaseConnection,
      DatabaseTable,
      DatabaseQuery,
    ]),
  ],
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}