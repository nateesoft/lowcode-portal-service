import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { DatabaseService } from '../services/database.service';
import {
  CreateDatabaseConnectionDto,
  UpdateDatabaseConnectionDto,
  DatabaseConnectionResponseDto,
  ExecuteQueryDto,
  SaveQueryDto,
  QueryResultDto,
  DatabaseTableResponseDto,
  GenerateCRUDDto,
  CRUDPreviewDto,
} from '../dto/database.dto';
import { DatabaseQuery } from '../entities/database-query.entity';

@Controller('database')
@UseGuards(AuthGuard('jwt'))
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  // Database Connection Management
  @Post('connections')
  async createConnection(
    @Body() createDto: CreateDatabaseConnectionDto,
    @Request() req,
  ): Promise<DatabaseConnectionResponseDto> {
    return await this.databaseService.createConnection(createDto, req.user.id);
  }

  @Get('connections')
  async getAllConnections(@Request() req): Promise<DatabaseConnectionResponseDto[]> {
    return await this.databaseService.getAllConnections(req.user.id);
  }

  @Get('connections/:id')
  async getConnection(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<DatabaseConnectionResponseDto> {
    return await this.databaseService.getConnection(id, req.user.id);
  }

  @Put('connections/:id')
  async updateConnection(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDatabaseConnectionDto,
    @Request() req,
  ): Promise<DatabaseConnectionResponseDto> {
    return await this.databaseService.updateConnection(id, updateDto, req.user.id);
  }

  @Delete('connections/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConnection(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<void> {
    return await this.databaseService.deleteConnection(id, req.user.id);
  }

  @Post('connections/:id/test')
  async testConnection(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<{ success: boolean }> {
    const result = await this.databaseService.testConnection(id, req.user.id);
    return { success: result };
  }

  // Table Management
  @Post('connections/:id/tables/refresh')
  async refreshTables(
    @Param('id', ParseIntPipe) connectionId: number,
    @Request() req,
  ): Promise<DatabaseTableResponseDto[]> {
    return await this.databaseService.refreshTables(connectionId, req.user.id);
  }

  @Get('connections/:id/tables')
  async getTables(
    @Param('id', ParseIntPipe) connectionId: number,
    @Request() req,
  ): Promise<DatabaseTableResponseDto[]> {
    return await this.databaseService.getTables(connectionId, req.user.id);
  }

  // Query Execution
  @Post('connections/:id/execute')
  async executeQuery(
    @Param('id', ParseIntPipe) connectionId: number,
    @Body() executeDto: ExecuteQueryDto,
    @Request() req,
  ): Promise<QueryResultDto> {
    return await this.databaseService.executeQuery(connectionId, executeDto, req.user.id);
  }

  // Query Management
  @Post('connections/:id/queries')
  async saveQuery(
    @Param('id', ParseIntPipe) connectionId: number,
    @Body() saveDto: SaveQueryDto,
    @Request() req,
  ): Promise<DatabaseQuery> {
    return await this.databaseService.saveQuery(connectionId, saveDto, req.user.id);
  }

  @Get('connections/:id/queries')
  async getSavedQueries(
    @Param('id', ParseIntPipe) connectionId: number,
    @Request() req,
  ): Promise<DatabaseQuery[]> {
    return await this.databaseService.getSavedQueries(connectionId, req.user.id);
  }

  // CRUD Generation
  @Post('connections/:id/generate-crud')
  async generateCRUD(
    @Param('id', ParseIntPipe) connectionId: number,
    @Body() generateDto: GenerateCRUDDto,
    @Request() req,
  ): Promise<CRUDPreviewDto> {
    return await this.databaseService.generateCRUD(connectionId, generateDto, req.user.id);
  }
}