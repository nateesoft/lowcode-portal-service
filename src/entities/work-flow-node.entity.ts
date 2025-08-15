import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { WorkFlow } from './work-flow.entity';
import { Page } from './page.entity';
import { Component } from './component.entity';

export enum NodeType {
  START = 'start',
  END = 'end',
  PROCESS = 'process',
  DECISION = 'decision',
  PAGE = 'page',
  SERVICE = 'service',
  COMPONENT = 'component',
  API = 'api',
  DATABASE = 'database',
  CONDITION = 'condition',
  LOOP = 'loop',
  DELAY = 'delay',
  NOTIFICATION = 'notification',
  CUSTOM = 'custom'
}

export enum NodeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending',
  COMPLETED = 'completed'
}

export enum LinkType {
  PAGE = 'page',
  SERVICE = 'service',
  COMPONENT = 'component',
  EXTERNAL_URL = 'external_url',
  API_ENDPOINT = 'api_endpoint',
  DATABASE_QUERY = 'database_query',
  CUSTOM_FUNCTION = 'custom_function'
}

@Entity('work_flow_nodes')
@Index(['workflowId'])
@Index(['nodeId'])
@Index(['nodeType'])
@Index(['status'])
@Index(['linkType'])
export class WorkFlowNode {
  @PrimaryGeneratedColumn()
  id: number;

  // Node identification in the workflow
  @Column({ name: 'node_id' })
  nodeId: string; // Unique ID within the workflow (e.g., 'node_1', 'start_1')

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ name: 'node_type', default: 'process' })
  nodeType: NodeType;

  @Column({ default: 'active' })
  status: NodeStatus;

  // Node position and styling
  @Column('json', { nullable: true })
  position?: {
    x: number;
    y: number;
    z?: number;
  };

  @Column('json', { nullable: true })
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

  // Node data and configuration
  @Column('json', { nullable: true })
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

  // Linking to other entities
  @Column({ name: 'link_type', nullable: true })
  linkType?: LinkType;

  @Column({ name: 'link_id', nullable: true })
  linkId?: number; // ID of the linked entity (page.id, component.id, etc.)

  @Column({ name: 'external_url', nullable: true })
  externalUrl?: string; // For external links

  @Column('json', { nullable: true })
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

  // Node execution and business logic
  @Column('text', { nullable: true })
  customCode?: string; // JavaScript code for custom nodes

  @Column('json', { nullable: true })
  executionConfig?: {
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    async?: boolean;
    parallel?: boolean;
    batchSize?: number;
    errorHandling?: 'stop' | 'continue' | 'retry' | 'skip';
  };

  // Node validation and rules
  @Column('json', { nullable: true })
  validationRules?: Array<{
    field: string;
    rule: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;

  // Node metadata and analytics
  @Column('json', { nullable: true })
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

  // Node documentation
  @Column('text', { nullable: true })
  documentation?: string;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  // Relations
  @ManyToOne(() => WorkFlow, workflow => workflow.nodes)
  @JoinColumn({ name: 'workflow_id' })
  workflow: WorkFlow;

  @Column({ name: 'workflow_id' })
  workflowId: number;

  // Linked entities (optional - will be loaded based on linkType and linkId)
  @ManyToOne(() => Page, { nullable: true })
  @JoinColumn({ name: 'linked_page_id' })
  linkedPage?: Page;

  @Column({ name: 'linked_page_id', nullable: true })
  linkedPageId?: number;

  @ManyToOne(() => Component, { nullable: true })
  @JoinColumn({ name: 'linked_component_id' })
  linkedComponent?: Component;

  @Column({ name: 'linked_component_id', nullable: true })
  linkedComponentId?: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by' })
  createdById: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}