import { IsString, IsOptional, IsEnum, IsArray, IsObject, IsNumber, IsUrl, MinLength, MaxLength } from 'class-validator';
import { NodeType, NodeStatus, LinkType } from '../../../entities/work-flow-node.entity';

export class CreateWorkFlowNodeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  nodeId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(NodeType)
  nodeType?: NodeType;

  @IsOptional()
  @IsEnum(NodeStatus)
  status?: NodeStatus;

  @IsOptional()
  @IsObject()
  position?: {
    x: number;
    y: number;
    z?: number;
  };

  @IsOptional()
  @IsObject()
  styling?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    color?: string;
    fontSize?: number;
    fontWeight?: string;
    className?: string;
  };

  @IsOptional()
  @IsObject()
  nodeData?: {
    label?: string;
    icon?: string;
    inputs?: Array<{
      id: string;
      label: string;
      type: string;
      required?: boolean;
      defaultValue?: any;
    }>;
    outputs?: Array<{
      id: string;
      label: string;
      type: string;
    }>;
    parameters?: Record<string, any>;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
      logicOperator?: 'AND' | 'OR';
    }>;
  };

  @IsOptional()
  @IsEnum(LinkType)
  linkType?: LinkType;

  @IsOptional()
  @IsNumber()
  linkId?: number;

  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @IsOptional()
  @IsObject()
  linkConfiguration?: {
    openInNewTab?: boolean;
    passParameters?: boolean;
    parameters?: Record<string, any>;
    headers?: Record<string, string>;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    authentication?: {
      type?: 'none' | 'basic' | 'bearer' | 'api_key';
      credentials?: Record<string, string>;
    };
  };

  @IsOptional()
  @IsString()
  customCode?: string;

  @IsOptional()
  @IsObject()
  executionConfig?: {
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    async?: boolean;
    parallel?: boolean;
    batchSize?: number;
    errorHandling?: 'stop' | 'continue' | 'retry' | 'skip';
  };

  @IsOptional()
  @IsArray()
  validationRules?: Array<{
    field: string;
    rule: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;

  @IsOptional()
  @IsObject()
  metadata?: {
    executionCount?: number;
    lastExecuted?: string;
    avgExecutionTime?: number;
    errorCount?: number;
    successRate?: number;
    dependencies?: string[];
    dependents?: string[];
    complexity?: 'simple' | 'medium' | 'complex';
    estimatedTime?: number;
    actualTime?: number;
    cost?: number;
    priority?: number;
  };

  @IsOptional()
  @IsString()
  documentation?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  workflowId?: number;

  @IsOptional()
  @IsNumber()
  linkedPageId?: number;

  @IsOptional()
  @IsNumber()
  linkedComponentId?: number;

  @IsOptional()
  @IsNumber()
  createdById?: number;
}