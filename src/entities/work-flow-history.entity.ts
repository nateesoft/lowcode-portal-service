import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { WorkFlow } from './work-flow.entity';

export enum ChangeType {
  MANUAL = 'manual',
  AUTO = 'auto',
  IMPORT = 'import',
  RESTORE = 'restore',
  MERGE = 'merge',
  REVERT = 'revert',
  DEPLOY = 'deploy',
  ROLLBACK = 'rollback'
}

@Entity('work_flow_history')
@Index(['workflowId', 'version'])
@Index(['changeType'])
@Index(['createdAt'])
export class WorkFlowHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'workflow_id' })
  workflowId: number;

  @Column()
  version: string;

  // Snapshot of workflow data at this version
  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ name: 'workflow_type' })
  workflowType: string;

  @Column()
  status: string;

  @Column({ name: 'is_active' })
  isActive: boolean;

  // Complete workflow configuration snapshot
  @Column('json', { nullable: true })
  configuration?: any;

  // Complete canvas data snapshot
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

  // Workflow variables snapshot
  @Column('json', { nullable: true })
  variables?: Array<{
    name: string;
    type: string;
    defaultValue?: any;
    description?: string;
    required?: boolean;
    scope?: string;
  }>;

  // Permissions snapshot
  @Column('json', { nullable: true })
  permissions?: any;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  // Change tracking
  @Column({ name: 'change_description', nullable: true })
  changeDescription?: string;

  @Column({ name: 'change_type', default: 'manual' })
  changeType: ChangeType;

  // Detailed change metadata
  @Column('json', { name: 'metadata', nullable: true })
  metadata?: {
    // Workflow metrics
    nodeCount?: number;
    edgeCount?: number;
    complexity?: 'simple' | 'medium' | 'complex';
    
    // Performance metrics
    canvasSize?: number; // Size of canvas data in bytes
    configurationSize?: number;
    variablesCount?: number;
    tagsCount?: number;
    
    // Change tracking
    changedNodes?: string[]; // IDs of nodes that changed
    addedNodes?: string[];
    removedNodes?: string[];
    changedEdges?: string[];
    addedEdges?: string[];
    removedEdges?: string[];
    
    // Deployment info
    deploymentInfo?: {
      environment?: string;
      deployedAt?: string;
      deployedBy?: number;
      buildId?: string;
      commitHash?: string;
    };
    
    // Rollback info
    rollbackFrom?: string; // Version that was rolled back from
    rollbackReason?: string;
    
    // Import/Export info
    importSource?: string;
    exportFormat?: string;
    dataSourceVersion?: string;
    
    // Merge info
    mergedFromVersions?: string[];
    conflictResolution?: Record<string, any>;
    
    // Performance and execution data
    lastExecutionTime?: number;
    executionCount?: number;
    errorCount?: number;
    warningCount?: number;
    successRate?: number;
    
    // User interaction data
    sessionDuration?: number; // How long user worked on this version
    actionsCount?: number; // Number of actions performed
    undoRedoCount?: number;
  };

  // Version comparison data
  @Column('json', { nullable: true })
  diff?: {
    previous?: string; // Previous version number
    changes?: Array<{
      type: 'added' | 'removed' | 'modified';
      path: string; // JSON path of the change
      oldValue?: any;
      newValue?: any;
      description?: string;
    }>;
    summary?: {
      additions: number;
      deletions: number;
      modifications: number;
    };
  };

  // Relations
  @ManyToOne(() => WorkFlow, workflow => workflow.history)
  @JoinColumn({ name: 'workflow_id' })
  workflow: WorkFlow;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  user: User;

  @Column({ name: 'created_by' })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}