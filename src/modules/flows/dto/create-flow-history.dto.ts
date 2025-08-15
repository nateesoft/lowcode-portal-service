import { IsString, IsOptional, IsIn, IsObject } from 'class-validator';

export class CreateFlowHistoryDto {
  @IsString()
  flowId: string;

  @IsString()
  version: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  status: string;

  @IsObject()
  configuration: any;

  @IsOptional()
  @IsString()
  changeDescription?: string;

  @IsOptional()
  @IsIn(['manual', 'auto', 'import', 'restore'])
  changeType?: 'manual' | 'auto' | 'import' | 'restore';

  @IsOptional()
  @IsObject()
  metadata?: {
    nodeCount?: number;
    edgeCount?: number;
    tags?: string[];
    deployedAt?: string;
    rollbackFrom?: string;
    importSource?: string;
    [key: string]: any;
  };
}