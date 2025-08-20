import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsObject, Min, Max, MaxLength } from 'class-validator';
import { DatabaseType, ConnectionStatus } from '../entities/database-connection.entity';
import { DatabaseColumn } from '../entities/database-table.entity';

// Database Connection DTOs
export class CreateDatabaseConnectionDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsEnum(DatabaseType)
  type: DatabaseType;

  @IsString()
  @MaxLength(255)
  host: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @IsString()
  @MaxLength(255)
  database: string;

  @IsString()
  @MaxLength(255)
  username: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsObject()
  connectionConfig?: any;
}

export class UpdateDatabaseConnectionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  host?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  port?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  database?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsObject()
  connectionConfig?: any;
}

export class DatabaseConnectionResponseDto {
  id: number;
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  status: ConnectionStatus;
  lastConnected?: string;
  lastTested?: string;
  lastError?: string;
  isActive: boolean;
  connectionConfig?: any;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  connectionString: string;
  isConnected: boolean;
  needsReconnection: boolean;
}

// Database Query DTOs
export class ExecuteQueryDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;
}

export class SaveQueryDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}

export class QueryResultDto {
  success: boolean;
  data?: any[];
  columns?: string[];
  rowsAffected: number;
  executionTime: string;
  error?: string;
}

// Database Table DTOs
export class DatabaseTableResponseDto {
  id: number;
  connectionId: number;
  name: string;
  schema?: string;
  columns: DatabaseColumn[];
  rowCount: number;
  size?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  primaryKeyColumns: DatabaseColumn[];
  indexedColumns: DatabaseColumn[];
  nonNullableColumns: DatabaseColumn[];
}

export class GenerateCRUDDto {
  @IsString()
  tableName: string;

  @IsOptional()
  @IsString({ each: true })
  selectedColumns?: string[];

  @IsOptional()
  @IsString()
  componentName?: string;
}

export class CRUDPreviewDto {
  tableName: string;
  columns: DatabaseColumn[];
  sampleData: any[];
  totalRows: number;
  generatedQueries: {
    create: string;
    read: string;
    update: string;
    delete: string;
  };
}