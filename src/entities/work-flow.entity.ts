import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { User } from './user.entity';
import { MyProject } from './my-project.entity';
import { WorkFlowNode } from './work-flow-node.entity';
import { WorkFlowHistory } from './work-flow-history.entity';

export enum WorkFlowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active', 
  TESTING = 'testing',
  DEPLOYED = 'deployed',
  ARCHIVED = 'archived'
}

export enum WorkFlowType {
  USER_JOURNEY = 'user-journey',
  BUSINESS_PROCESS = 'business-process',
  API_FLOW = 'api-flow',
  DATA_FLOW = 'data-flow',
  UI_FLOW = 'ui-flow',
  AUTOMATION = 'automation',
  OTHER = 'other'
}

@Entity('work_flows')
@Index(['projectId'])
@Index(['status'])
@Index(['workflowType'])
@Index(['isActive'])
export class WorkFlow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ name: 'workflow_type', default: 'user-journey' })
  workflowType: WorkFlowType;

  @Column({ default: 'draft' })
  status: WorkFlowStatus;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ default: '1.0.0' })
  version: string;

  // Workflow configuration
  @Column('json', { nullable: true })
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

  // Workflow canvas data (React Flow format)
  @Column('json', { nullable: true })
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

  // Workflow metadata
  @Column('json', { nullable: true })
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

  // Workflow variables and parameters
  @Column('json', { nullable: true })
  variables?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    defaultValue?: any;
    description?: string;
    required?: boolean;
    scope?: 'global' | 'local';
  }>;

  // Workflow permissions and access control
  @Column('json', { nullable: true })
  permissions?: {
    canExecute?: boolean;
    canEdit?: boolean;
    canView?: boolean;
    allowedUsers?: number[];
    allowedRoles?: string[];
    isPublic?: boolean;
  };

  // Tags for categorization
  @Column('simple-array', { nullable: true })
  tags?: string[];

  // Relations
  @ManyToOne(() => MyProject, project => project.workflows)
  @JoinColumn({ name: 'project_id' })
  project: MyProject;

  @Column({ name: 'project_id' })
  projectId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by' })
  createdById: number;

  @OneToMany(() => WorkFlowNode, node => node.workflow, { cascade: true })
  nodes: WorkFlowNode[];

  @OneToMany(() => WorkFlowHistory, history => history.workflow, { cascade: true })
  history: WorkFlowHistory[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}