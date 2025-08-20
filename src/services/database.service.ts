import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as CryptoJS from 'crypto-js';
import * as knex from 'knex';

import { DatabaseConnection, DatabaseType, ConnectionStatus } from '../entities/database-connection.entity';
import { DatabaseTable, DatabaseColumn } from '../entities/database-table.entity';
import { DatabaseQuery } from '../entities/database-query.entity';

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

@Injectable()
export class DatabaseService {
  private activeConnections = new Map<number, any>();
  private readonly encryptionKey = process.env.DB_ENCRYPTION_KEY || 'default-key-change-in-production';

  constructor(
    @InjectRepository(DatabaseConnection)
    private connectionRepository: Repository<DatabaseConnection>,
    @InjectRepository(DatabaseTable)
    private tableRepository: Repository<DatabaseTable>,
    @InjectRepository(DatabaseQuery)
    private queryRepository: Repository<DatabaseQuery>,
  ) {}

  // Connection Management
  async createConnection(createDto: CreateDatabaseConnectionDto, userId: number): Promise<DatabaseConnectionResponseDto> {
    const encryptedPassword = this.encryptPassword(createDto.password);

    const connection = this.connectionRepository.create({
      ...createDto,
      encryptedPassword,
      createdBy: userId,
      status: ConnectionStatus.DISCONNECTED,
    });

    const saved = await this.connectionRepository.save(connection);
    return this.toConnectionResponseDto(saved);
  }

  async updateConnection(id: number, updateDto: UpdateDatabaseConnectionDto, userId: number): Promise<DatabaseConnectionResponseDto> {
    const connection = await this.findConnectionByIdAndUser(id, userId);

    if (updateDto.password) {
      updateDto.password = this.encryptPassword(updateDto.password);
    }

    Object.assign(connection, updateDto);
    const updated = await this.connectionRepository.save(connection);
    
    // Close existing connection if config changed
    this.closeConnection(id);
    
    return this.toConnectionResponseDto(updated);
  }

  async deleteConnection(id: number, userId: number): Promise<void> {
    const connection = await this.findConnectionByIdAndUser(id, userId);
    
    // Close active connection
    this.closeConnection(id);
    
    // Delete related tables and queries
    await this.tableRepository.delete({ connectionId: id });
    await this.queryRepository.delete({ connectionId: id });
    
    await this.connectionRepository.remove(connection);
  }

  async testConnection(id: number, userId: number): Promise<boolean> {
    const connection = await this.findConnectionByIdAndUser(id, userId);
    
    try {
      // Update status to testing
      await this.connectionRepository.update(id, { 
        status: ConnectionStatus.TESTING,
        lastTested: new Date(),
      });

      const client = await this.createDatabaseClient(connection);
      
      // Test query based on database type
      const testQuery = connection.type === DatabaseType.MYSQL ? 'SELECT 1' : 'SELECT 1 as test';
      await client.raw(testQuery);
      
      // Update status to connected
      await this.connectionRepository.update(id, { 
        status: ConnectionStatus.CONNECTED,
        lastConnected: new Date(),
        lastError: undefined,
      });

      // Store the connection for reuse
      this.activeConnections.set(id, client);
      
      return true;
    } catch (error) {
      // Update status to error
      await this.connectionRepository.update(id, { 
        status: ConnectionStatus.ERROR,
        lastError: error.message,
      });
      
      return false;
    }
  }

  async getAllConnections(userId: number): Promise<DatabaseConnectionResponseDto[]> {
    const connections = await this.connectionRepository.find({
      where: { createdBy: userId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    return connections.map(conn => this.toConnectionResponseDto(conn));
  }

  async getConnection(id: number, userId: number): Promise<DatabaseConnectionResponseDto> {
    const connection = await this.findConnectionByIdAndUser(id, userId);
    return this.toConnectionResponseDto(connection);
  }

  // Table Management
  async refreshTables(connectionId: number, userId: number): Promise<DatabaseTableResponseDto[]> {
    const connection = await this.findConnectionByIdAndUser(connectionId, userId);
    
    if (!this.activeConnections.has(connectionId)) {
      const isConnected = await this.testConnection(connectionId, userId);
      if (!isConnected) {
        throw new BadRequestException('Cannot connect to database');
      }
    }

    const client = this.activeConnections.get(connectionId);
    
    try {
      const tables = await this.getTablesFromDatabase(client, connection.type, connection.database);
      
      // Clear existing tables for this connection
      await this.tableRepository.delete({ connectionId });
      
      // Save new tables
      const savedTables: DatabaseTableResponseDto[] = [];
      for (const tableData of tables) {
        const table = this.tableRepository.create({
          connectionId,
          name: tableData.name,
          schema: tableData.schema,
          columns: tableData.columns,
          rowCount: tableData.rowCount,
          size: tableData.size,
          comment: tableData.comment,
        });
        
        const saved = await this.tableRepository.save(table);
        savedTables.push(this.toTableResponseDto(saved));
      }
      
      return savedTables;
    } catch (error) {
      throw new BadRequestException(`Failed to refresh tables: ${error.message}`);
    }
  }

  async getTables(connectionId: number, userId: number): Promise<DatabaseTableResponseDto[]> {
    await this.findConnectionByIdAndUser(connectionId, userId);
    
    const tables = await this.tableRepository.find({
      where: { connectionId },
      order: { name: 'ASC' },
    });

    return tables.map(table => this.toTableResponseDto(table));
  }

  // Query Execution
  async executeQuery(connectionId: number, executeDto: ExecuteQueryDto, userId: number): Promise<QueryResultDto> {
    const connection = await this.findConnectionByIdAndUser(connectionId, userId);
    
    // Validate query
    this.validateQuery(executeDto.query);
    
    if (!this.activeConnections.has(connectionId)) {
      const isConnected = await this.testConnection(connectionId, userId);
      if (!isConnected) {
        throw new BadRequestException('Cannot connect to database');
      }
    }

    const client = this.activeConnections.get(connectionId);
    
    try {
      const startTime = Date.now();
      
      // Add LIMIT if it's a SELECT query and limit is specified
      let finalQuery = executeDto.query;
      if (executeDto.limit && executeDto.query.trim().toLowerCase().startsWith('select')) {
        finalQuery += ` LIMIT ${executeDto.limit}`;
      }
      
      const result = await client.raw(finalQuery);
      const executionTime = Date.now() - startTime;
      
      // Format result based on database type
      const formattedResult = this.formatQueryResult(result, connection.type);
      
      return {
        success: true,
        data: formattedResult.data,
        columns: formattedResult.columns,
        rowsAffected: formattedResult.rowsAffected,
        executionTime: `${executionTime}ms`,
      };
    } catch (error) {
      return {
        success: false,
        rowsAffected: 0,
        executionTime: '0ms',
        error: error.message,
      };
    }
  }

  // Query Management
  async saveQuery(connectionId: number, saveDto: SaveQueryDto, userId: number): Promise<DatabaseQuery> {
    await this.findConnectionByIdAndUser(connectionId, userId);
    
    const query = this.queryRepository.create({
      ...saveDto,
      connectionId,
      createdBy: userId,
    });

    return await this.queryRepository.save(query);
  }

  async getSavedQueries(connectionId: number, userId: number): Promise<DatabaseQuery[]> {
    await this.findConnectionByIdAndUser(connectionId, userId);
    
    return await this.queryRepository.find({
      where: { connectionId, createdBy: userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // CRUD Generation
  async generateCRUD(connectionId: number, generateDto: GenerateCRUDDto, userId: number): Promise<CRUDPreviewDto> {
    const connection = await this.findConnectionByIdAndUser(connectionId, userId);
    
    const table = await this.tableRepository.findOne({
      where: { connectionId, name: generateDto.tableName },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (!this.activeConnections.has(connectionId)) {
      const isConnected = await this.testConnection(connectionId, userId);
      if (!isConnected) {
        throw new BadRequestException('Cannot connect to database');
      }
    }

    const client = this.activeConnections.get(connectionId);
    
    // Get sample data
    const sampleResult = await client.raw(`SELECT * FROM ${generateDto.tableName} LIMIT 5`);
    const sampleData = this.formatQueryResult(sampleResult, connection.type).data;
    
    // Get total row count
    const countResult = await client.raw(`SELECT COUNT(*) as total FROM ${generateDto.tableName}`);
    const totalRows = countResult[0]?.total || countResult.rows?.[0]?.total || 0;
    
    // Generate CRUD queries
    const selectedColumns = generateDto.selectedColumns || table.columns.map(col => col.name);
    const generatedQueries = this.generateCRUDQueries(generateDto.tableName, selectedColumns, table.columns);
    
    return {
      tableName: generateDto.tableName,
      columns: table.columns.filter(col => selectedColumns.includes(col.name)),
      sampleData,
      totalRows,
      generatedQueries,
    };
  }

  // Private Methods
  private async findConnectionByIdAndUser(id: number, userId: number): Promise<DatabaseConnection> {
    const connection = await this.connectionRepository
      .createQueryBuilder('connection')
      .addSelect('connection.encryptedPassword')
      .where('connection.id = :id', { id })
      .andWhere('connection.createdBy = :userId', { userId })
      .andWhere('connection.isActive = :isActive', { isActive: true })
      .getOne();

    if (!connection) {
      throw new NotFoundException('Database connection not found');
    }

    return connection;
  }

  private encryptPassword(password: string): string {
    return CryptoJS.AES.encrypt(password, this.encryptionKey).toString();
  }

  private decryptPassword(encryptedPassword: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private async createDatabaseClient(connection: DatabaseConnection): Promise<any> {
    const password = this.decryptPassword(connection.encryptedPassword);
    
    const config = {
      host: connection.host,
      port: connection.port,
      user: connection.username,
      password: password,
      database: connection.database,
      ...connection.connectionConfig,
    };

    switch (connection.type) {
      case DatabaseType.MYSQL:
        return knex({
          client: 'mysql2',
          connection: config,
        });
      case DatabaseType.POSTGRESQL:
        return knex({
          client: 'pg',
          connection: config,
        });
      default:
        throw new BadRequestException(`Unsupported database type: ${connection.type}`);
    }
  }

  private async getTablesFromDatabase(client: any, dbType: DatabaseType, dbName: string): Promise<any[]> {
    let tablesQuery: string;
    
    switch (dbType) {
      case DatabaseType.MYSQL:
        tablesQuery = `
          SELECT 
            table_name as name,
            table_schema as \`schema\`,
            table_rows as row_count,
            round(((data_length + index_length) / 1024 / 1024), 2) as size_mb,
            table_comment as comment
          FROM information_schema.tables 
          WHERE table_schema = '${dbName}' AND table_type = 'BASE TABLE'
        `;
        break;
      case DatabaseType.POSTGRESQL:
        tablesQuery = `
          SELECT 
            tablename as name,
            schemaname as schema,
            0 as row_count,
            0 as size_mb,
            '' as comment
          FROM pg_tables 
          WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        `;
        break;
      default:
        throw new BadRequestException(`Unsupported database type: ${dbType}`);
    }

    const tables = await client.raw(tablesQuery);
    const tableList = dbType === DatabaseType.MYSQL ? tables[0] : tables.rows;
    
    // Get columns for each table
    const tablesWithColumns: Array<{
      name: string;
      schema: string;
      columns: DatabaseColumn[];
      rowCount: number;
      size: string;
      comment: string;
    }> = [];
    for (const table of tableList) {
      const columns = await this.getTableColumns(client, dbType, table.name, dbName);
      tablesWithColumns.push({
        name: table.name,
        schema: table.schema,
        columns,
        rowCount: table.row_count || 0,
        size: table.size_mb ? `${table.size_mb} MB` : '0 MB',
        comment: table.comment,
      });
    }
    
    return tablesWithColumns;
  }

  private async getTableColumns(client: any, dbType: DatabaseType, tableName: string, dbName: string): Promise<DatabaseColumn[]> {
    let columnsQuery: string;
    
    switch (dbType) {
      case DatabaseType.MYSQL:
        columnsQuery = `
          SELECT 
            column_name as name,
            data_type as type,
            is_nullable = 'YES' as nullable,
            column_default as default_value,
            column_key = 'PRI' as is_primary,
            column_key IN ('PRI', 'UNI', 'MUL') as is_index,
            character_maximum_length as length,
            column_comment as comment
          FROM information_schema.columns 
          WHERE table_schema = '${dbName}' AND table_name = '${tableName}'
          ORDER BY ordinal_position
        `;
        break;
      case DatabaseType.POSTGRESQL:
        columnsQuery = `
          SELECT 
            c.column_name as name,
            c.data_type as type,
            c.is_nullable = 'YES' as nullable,
            c.column_default as default_value,
            CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN true ELSE false END as is_primary,
            CASE WHEN i.indexname IS NOT NULL THEN true ELSE false END as is_index,
            c.character_maximum_length as length,
            '' as comment
          FROM information_schema.columns c
          LEFT JOIN information_schema.table_constraints tc 
            ON c.table_name = tc.table_name 
            AND c.table_schema = tc.table_schema
            AND tc.constraint_type = 'PRIMARY KEY'
          LEFT JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
            AND c.column_name = kcu.column_name
          LEFT JOIN pg_indexes i 
            ON c.table_name = i.tablename 
            AND c.table_schema = i.schemaname
            AND i.indexdef LIKE '%' || c.column_name || '%'
          WHERE c.table_name = '${tableName}'
            AND c.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
          ORDER BY c.ordinal_position
        `;
        break;
      default:
        return [];
    }

    const columns = await client.raw(columnsQuery);
    const columnList = dbType === DatabaseType.MYSQL ? columns[0] : columns.rows;
    
    return columnList.map((col: any) => ({
      name: col.name,
      type: col.type.toUpperCase(),
      nullable: col.nullable,
      defaultValue: col.default_value,
      isPrimary: col.is_primary,
      isIndex: col.is_index,
      length: col.length,
      comment: col.comment,
    }));
  }

  private formatQueryResult(result: any, dbType: DatabaseType): { data: any[], columns: string[], rowsAffected: number } {
    switch (dbType) {
      case DatabaseType.MYSQL:
        const data = result[0];
        const columns = data.length > 0 ? Object.keys(data[0]) : [];
        return {
          data,
          columns,
          rowsAffected: data.length,
        };
      case DatabaseType.POSTGRESQL:
        return {
          data: result.rows || [],
          columns: result.fields ? result.fields.map((f: any) => f.name) : [],
          rowsAffected: result.rowCount || result.rows?.length || 0,
        };
      default:
        return { data: [], columns: [], rowsAffected: 0 };
    }
  }

  private validateQuery(query: string): void {
    const trimmedQuery = query.trim().toLowerCase();
    
    // Block dangerous operations for now
    const dangerousCommands = ['drop', 'truncate', 'delete', 'update', 'insert', 'create', 'alter'];
    
    for (const cmd of dangerousCommands) {
      if (trimmedQuery.startsWith(cmd)) {
        throw new ForbiddenException(`${cmd.toUpperCase()} operations are not allowed for security reasons`);
      }
    }
  }

  private generateCRUDQueries(tableName: string, columns: string[], tableColumns: DatabaseColumn[]): any {
    const primaryKey = tableColumns.find(col => col.isPrimary)?.name || 'id';
    const columnsList = columns.join(', ');
    const valuesPlaceholder = columns.map(() => '?').join(', ');
    const updateSet = columns.filter(col => col !== primaryKey).map(col => `${col} = ?`).join(', ');
    
    return {
      create: `INSERT INTO ${tableName} (${columnsList}) VALUES (${valuesPlaceholder})`,
      read: `SELECT ${columnsList} FROM ${tableName}`,
      update: `UPDATE ${tableName} SET ${updateSet} WHERE ${primaryKey} = ?`,
      delete: `DELETE FROM ${tableName} WHERE ${primaryKey} = ?`,
    };
  }

  private closeConnection(connectionId: number): void {
    if (this.activeConnections.has(connectionId)) {
      const client = this.activeConnections.get(connectionId);
      client.destroy();
      this.activeConnections.delete(connectionId);
    }
  }

  private toConnectionResponseDto(connection: DatabaseConnection): DatabaseConnectionResponseDto {
    return {
      id: connection.id,
      name: connection.name,
      type: connection.type,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      status: connection.status,
      lastConnected: connection.lastConnected?.toISOString(),
      lastTested: connection.lastTested?.toISOString(),
      lastError: connection.lastError,
      isActive: connection.isActive,
      connectionConfig: connection.connectionConfig,
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
      createdBy: connection.createdBy,
      connectionString: connection.connectionString,
      isConnected: connection.isConnected,
      needsReconnection: connection.needsReconnection,
    };
  }

  private toTableResponseDto(table: DatabaseTable): DatabaseTableResponseDto {
    return {
      id: table.id,
      connectionId: table.connectionId,
      name: table.name,
      schema: table.schema,
      columns: table.columns,
      rowCount: table.rowCount,
      size: table.size,
      comment: table.comment,
      createdAt: table.createdAt.toISOString(),
      updatedAt: table.updatedAt.toISOString(),
      primaryKeyColumns: table.primaryKeyColumns,
      indexedColumns: table.indexedColumns,
      nonNullableColumns: table.nonNullableColumns,
    };
  }
}