import type { 
  DefinitionOfDone, 
  ChecklistItem, 
  Artifact, 
  TaskStatus,
  TransitionResult,
  ProbeResult
} from '../types.js';
import { runAdversarialProbes } from '../adversarial/index.js';

export function createDoD(
  name: string,
  items: Omit<ChecklistItem, 'id'>[]
): DefinitionOfDone {
  return {
    id: `dod-${Math.random().toString(36).substr(2, 9)}`,
    name,
    items: items.map((item, idx) => ({
      ...item,
      id: `item-${idx + 1}`
    }))
  };
}

export function verifyDoD(
  dod: DefinitionOfDone,
  artifacts: Artifact[]
): { passed: boolean; results: { itemId: string; passed: boolean; details: string }[] } {
  const results = dod.items.map(item => {
    try {
      const checkResult = item.check(artifacts);
      const verification = item.verification ? item.verification(artifacts) : '';
      
      return {
        itemId: item.id,
        passed: checkResult,
        details: verification || (checkResult ? 'Passed' : 'Failed')
      };
    } catch (e) {
      return {
        itemId: item.id,
        passed: false,
        details: `Error: ${e instanceof Error ? e.message : 'Unknown error'}`
      };
    }
  });
  
  return {
    passed: results.every(r => r.passed),
    results
  };
}

export function canTransition(
  from: TaskStatus,
  to: TaskStatus,
  dod: DefinitionOfDone | undefined,
  artifacts: Artifact[],
  runProbes: boolean = true
): TransitionResult {
  const validTransitions: Record<TaskStatus, TaskStatus[]> = {
    'todo': ['in_progress'],
    'in_progress': ['pending_review', 'blocked', 'need_info'],
    'need_info': ['in_progress', 'blocked'],
    'blocked': ['in_progress', 'todo'],
    'pending_review': ['done', 'in_progress'],
    'done': []
  };
  
  if (!validTransitions[from].includes(to)) {
    return {
      success: false,
      from,
      to,
      error: `Invalid transition from ${from} to ${to}`
    };
  }
  
  if (dod && to === 'pending_review') {
    const dodResult = verifyDoD(dod, artifacts);
    if (!dodResult.passed) {
      return {
        success: false,
        from,
        to,
        dodPassed: false,
        error: `DoD check failed: ${dodResult.results.filter(r => !r.passed).map(r => r.details).join(', ')}`
      };
    }
  }
  
  let probeResults: ProbeResult[] = [];
  if (runProbes && (to === 'pending_review' || to === 'done')) {
    probeResults = runAdversarialProbes(artifacts);
    const allPassed = probeResults.every(p => p.passed);
    if (!allPassed && to === 'done') {
      return {
        success: false,
        from,
        to,
        probesRun: probeResults.length,
        probeResults,
        error: `Adversarial probes failed: ${probeResults.filter(p => !p.passed).map(p => p.name).join(', ')}`
      };
    }
  }
  
  return {
    success: true,
    from,
    to,
    dodPassed: true,
    probesRun: probeResults.length,
    probeResults
  };
}

export function getGateForTransition(from: TaskStatus, to: TaskStatus): string | null {
  if (to === 'pending_review') {
    return 'DoD verification required';
  }
  if (to === 'done') {
    return 'Adversarial probes required';
  }
  return null;
}

export const defaultDoD = createDoD('Default DoD', [
  {
    description: 'All acceptance criteria met',
    check: (artifacts: Artifact[]) => {
      const doc = artifacts.find(a => a.metadata?.isSpec);
      if (!doc) return false;
      const criteria = doc.metadata?.acceptanceCriteria as string[] | undefined;
      if (!criteria) return true;
      return criteria.every(c => artifacts.some(a => a.content.includes(c)));
    }
  },
  {
    description: 'No TODO comments remaining',
    check: (artifacts: Artifact[]) => {
      return !artifacts.some(a => a.content.includes('TODO') || a.content.includes('FIXME'));
    }
  },
  {
    description: 'Tests pass',
    check: (artifacts: Artifact[]) => {
      const tests = artifacts.filter(a => a.type === 'test');
      return tests.length > 0;
    }
  },
  {
    description: 'Code compiles without errors',
    check: (artifacts: Artifact[]) => {
      const code = artifacts.filter(a => a.type === 'code' || a.type === 'file');
      return code.length > 0;
    }
  }
]);