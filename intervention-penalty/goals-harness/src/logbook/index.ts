import type { WorkUnit, TaskStatus, Artifact } from '../types.js';
import { verifyDoD, canTransition, defaultDoD } from '../dod/index.js';
import { runAdversarialProbes } from '../adversarial/index.js';
import { measureAllKPIs } from '../kpis/index.js';

export interface LogbookClient {
  currentTask(): Promise<WorkUnit | null>;
  listTasks(status?: TaskStatus): Promise<WorkUnit[]>;
  createTask(input: CreateTaskInput): Promise<WorkUnit>;
  updateTask(id: string, status: TaskStatus, comment?: string): Promise<WorkUnit>;
  editTask(id: string, updates: Partial<WorkUnit>): Promise<WorkUnit>;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  artifacts?: Artifact[];
  dod?: string;
}

export async function createTaskWithBosun(
  client: LogbookClient,
  input: CreateTaskInput
): Promise<WorkUnit> {
  return client.createTask({
    ...input,
    dod: input.dod || 'default'
  });
}

export async function advanceWithChecks(
  client: LogbookClient,
  taskId: string,
  to: TaskStatus,
  artifacts: Artifact[]
): Promise<{
  task: WorkUnit;
  transition: {
    success: boolean;
    dodPassed?: boolean;
    probesRun?: number;
    failedProbes?: string[];
  };
  kpis: ReturnType<typeof measureAllKPIs>;
}> {
  const currentTasks = await client.listTasks('in_progress');
  const task = currentTasks.find(t => t.id === taskId);
  
  if (!task) {
    throw new Error(`Task ${taskId} not found or not in progress`);
  }
  
  const dodResult = task.dod || defaultDoD;
  const transition = canTransition(task.status, to, dodResult, artifacts, true);
  
  if (!transition.success) {
    return {
      task,
      transition: {
        success: false,
        dodPassed: transition.dodPassed,
        probesRun: transition.probesRun,
        failedProbes: transition.probeResults?.filter(p => !p.passed).map(p => p.name)
      },
      kpis: measureAllKPIs(artifacts, task)
    };
  }
  
  const updatedTask = await client.updateTask(taskId, to);
  
  return {
    task: updatedTask,
    transition: {
      success: true,
      dodPassed: transition.dodPassed,
      probesRun: transition.probesRun
    },
    kpis: measureAllKPIs(artifacts, updatedTask)
  };
}

export async function checkProgress(
  client: LogbookClient,
  taskId: string,
  artifacts: Artifact[]
): Promise<{
  kpis: ReturnType<typeof measureAllKPIs>;
  dodStatus?: ReturnType<typeof verifyDoD>;
  probeResults: ReturnType<typeof runAdversarialProbes>;
}> {
  const tasks = await client.listTasks();
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }
  
  const dodStatus = task.dod ? verifyDoD(task.dod, artifacts) : undefined;
  const probeResults = runAdversarialProbes(artifacts);
  
  return {
    kpis: measureAllKPIs(artifacts, task),
    dodStatus,
    probeResults
  };
}

export async function getTaskSummary(
  client: LogbookClient
): Promise<{
  todo: number;
  in_progress: number;
  need_info: number;
  blocked: number;
  pending_review: number;
  done: number;
}> {
  const allTasks = await client.listTasks();
  
  return allTasks.reduce(
    (acc, task) => {
      acc[task.status]++;
      return acc;
    },
    { todo: 0, in_progress: 0, need_info: 0, blocked: 0, pending_review: 0, done: 0 }
  );
}

export function formatKPIReport(kpis: ReturnType<typeof measureAllKPIs>): string {
  const lines = ['## KPI Report', ''];
  
  for (const kpi of kpis) {
    const icon = kpi.passed ? '✓' : '✗';
    lines.push(`${icon} **${kpi.type}**: ${kpi.details} (target: ${kpi.target})`);
  }
  
  return lines.join('\n');
}

export function formatProbeReport(probes: ReturnType<typeof runAdversarialProbes>): string {
  const lines = ['## Adversarial Probe Report', ''];
  
  const byCategory = new Map<string, typeof probes>();
  for (const probe of probes) {
    const existing = byCategory.get(probe.category) || [];
    existing.push(probe);
    byCategory.set(probe.category, existing);
  }
  
  for (const [category, categoryProbes] of byCategory) {
    lines.push(`### ${category.replace('_', ' ').toUpperCase()}`);
    for (const probe of categoryProbes) {
      const icon = probe.passed ? '✓' : '✗';
      lines.push(`${icon} ${probe.name}: ${probe.details}`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}