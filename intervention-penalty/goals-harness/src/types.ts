export type TaskStatus = 'todo' | 'in_progress' | 'need_info' | 'blocked' | 'pending_review' | 'done';

export type KPIType =
  | 'specification_adherence'
  | 'citation_density'
  | 'citation_integrity'
  | 'cross_reference_consistency'
  | 'review_convergence'
  | 'first_draft_acceptance'
  | 'terminology_consistency'
  | 'cycle_time';

export interface KPIResult {
  type: KPIType;
  value: number;
  target: number;
  passed: boolean;
  details: string;
}

export interface Artifact {
  id: string;
  type: 'file' | 'code' | 'doc' | 'test' | 'config';
  path: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface ChecklistItem {
  id: string;
  description: string;
  check: (artifacts: Artifact[]) => boolean;
  verification?: (artifacts: Artifact[]) => string;
}

export interface DefinitionOfDone {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export interface WorkUnit {
  id: string;
  title: string;
  status: TaskStatus;
  artifacts: Artifact[];
  createdAt: number;
  startedAt?: number;
  doneAt?: number;
  inProgressAt?: number;
  inReviewAt?: number;
  dod?: DefinitionOfDone;
  kpis: Map<KPIType, KPIResult>;
}

export interface KeyResult {
  id: string;
  description: string;
  kpi: KPIType;
  threshold: number;
  measurementMethod: string;
}

export interface Objective {
  id: string;
  description: string;
  keyResults: KeyResult[];
}

export interface ProjectOKR {
  projectId: string;
  name: string;
  objectives: Objective[];
}

export interface SectionOKR {
  sectionId: string;
  name: string;
  parentObjective: string;
  keyResults: KeyResult[];
}

export type ProbeCategory =
  | 'input_validation'
  | 'security'
  | 'error_handling'
  | 'edge_cases'
  | 'performance';

export interface ProbeDefinition {
  id: string;
  category: ProbeCategory;
  name: string;
  description: string;
  execute: (artifacts: Artifact[]) => ProbeResult;
}

export interface ProbeResult {
  id: string;
  category: ProbeCategory;
  name: string;
  passed: boolean;
  details: string;
  recommendations?: string[];
}

export interface TransitionResult {
  success: boolean;
  from: TaskStatus;
  to: TaskStatus;
  dodPassed?: boolean;
  probesRun?: number;
  probeResults?: ProbeResult[];
  error?: string;
}

export interface OKRStatus {
  objectiveId: string;
  onTrack: boolean;
  keyResults: {
    keyResultId: string;
    current: number;
    target: number;
    passed: boolean;
  }[];
}

export interface Project {
  id: string;
  name: string;
  okr: ProjectOKR;
  workUnits: WorkUnit[];
  createdAt: number;
}