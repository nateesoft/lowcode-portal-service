import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsObject, IsNumber, MinLength, MaxLength } from 'class-validator';
import { WorkFlowStatus, WorkFlowType } from '../../../entities/work-flow.entity';

export class CreateWorkFlowDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(WorkFlowType)
  workflowType?: WorkFlowType;

  @IsOptional()
  @IsEnum(WorkFlowStatus)
  status?: WorkFlowStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsObject()
  configuration?: {
    layout?: {
      direction?: 'horizontal' | 'vertical';
      spacing?: number;
      alignment?: 'start' | 'center' | 'end';
    };
    theme?: {
      nodeColor?: string;
      edgeColor?: string;
      backgroundColor?: string;
      gridEnabled?: boolean;
    };
    settings?: {
      autoSave?: boolean;
      autoLayout?: boolean;
      snapToGrid?: boolean;
      showMinimap?: boolean;
      enableZoom?: boolean;
      enablePan?: boolean;
    };
  };

  @IsOptional()
  @IsObject()
  canvasData?: {
    nodes?: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: any;
      style?: any;
      className?: string;
    }>;
    edges?: Array<{
      id: string;
      source: string;
      target: string;
      sourceHandle?: string;
      targetHandle?: string;
      type?: string;
      animated?: boolean;
      style?: any;
      label?: string;
    }>;
    viewport?: {
      x: number;
      y: number;
      zoom: number;
    };
  };

  @IsOptional()
  @IsObject()
  metadata?: {
    nodeCount?: number;
    edgeCount?: number;
    complexity?: 'simple' | 'medium' | 'complex';
    estimatedExecutionTime?: number;
    lastExecuted?: string;
    executionCount?: number;
    errorCount?: number;
    successRate?: number;
    performance?: {
      avgExecutionTime?: number;
      minExecutionTime?: number;
      maxExecutionTime?: number;
    };
  };

  @IsOptional()
  @IsArray()
  variables?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    defaultValue?: any;
    description?: string;
    required?: boolean;
    scope?: 'global' | 'local';
  }>;

  @IsOptional()
  @IsObject()
  permissions?: {
    canExecute?: boolean;
    canEdit?: boolean;
    canView?: boolean;
    allowedUsers?: number[];
    allowedRoles?: string[];
    isPublic?: boolean;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsOptional()
  @IsNumber()
  createdById?: number;
}