import type { KPIType, KPIResult, Artifact, WorkUnit } from '../types.js';

export interface KPIConfig {
  type: KPIType;
  name: string;
  target: number;
  measure: (artifacts: Artifact[], workUnit?: WorkUnit) => number;
  verify: (value: number, target: number) => { passed: boolean; details: string };
}

const kpiConfigs: Map<KPIType, KPIConfig> = new Map();

function createKPICheck(value: number, target: number, comparator: 'gte' | 'eq' | 'lte'): { passed: boolean; details: string } {
  let passed: boolean;
  let details: string;
  
  if (comparator === 'gte') {
    passed = value >= target;
    details = passed ? `✓ ${value.toFixed(2)} ≥ ${target}` : `✗ ${value.toFixed(2)} < ${target}`;
  } else if (comparator === 'eq') {
    passed = value === target;
    details = passed ? `✓ ${value} = ${target}` : `✗ ${value} ≠ ${target}`;
  } else {
    passed = value <= target;
    details = passed ? `✓ ${value.toFixed(2)} ≤ ${target}` : `✗ ${value.toFixed(2)} > ${target}`;
  }
  
  return { passed, details };
}

kpiConfigs.set('specification_adherence', {
  type: 'specification_adherence',
  name: 'Specification Adherence',
  target: 0.90,
  measure: (artifacts: Artifact[]): number => {
    const spec = artifacts.find(a => a.type === 'doc' && a.metadata?.isSpec);
    if (!spec) return 0;
    
    const requirements = spec.metadata?.requirements as string[] | undefined;
    if (!requirements) return 0;
    
    const totalRequirements = requirements.length;
    if (totalRequirements === 0) return 1;
    
    const requirementsMet = requirements.filter((r: string) => 
      artifacts.some(a => a.content.includes(r))
    ).length;
    
    return requirementsMet / totalRequirements;
  },
  verify: (value: number, target: number) => createKPICheck(value, target, 'gte')
});

kpiConfigs.set('citation_density', {
  type: 'citation_density',
  name: 'Citation Density',
  target: 2.0,
  measure: (artifacts: Artifact[]): number => {
    const docs = artifacts.filter(a => a.type === 'doc');
    if (docs.length === 0) return 0;
    
    const totalContent = docs.map(a => a.content).join(' ');
    const words = totalContent.split(/\s+/).length;
    const citations = (totalContent.match(/\[[\d,\s]+\]|\[cite:[\w-]+\]/g) || []).length;
    
    if (words === 0) return 0;
    return (citations / words) * 250;
  },
  verify: (value: number, target: number) => createKPICheck(value, target, 'gte')
});

kpiConfigs.set('citation_integrity', {
  type: 'citation_integrity',
  name: 'Citation Integrity',
  target: 1.0,
  measure: (artifacts: Artifact[]): number => {
    const docs = artifacts.filter(a => a.type === 'doc');
    if (docs.length === 0) return 0;
    
    const totalContent = docs.map(a => a.content).join(' ');
    const citations = totalContent.match(/\[[\d,\s]+\]|\[cite:[\w-]+\]/g) || [];
    
    if (citations.length === 0) return 1;
    
    const citedKeys = new Set(citations.map((c: string) => c.replace(/[\[\]]/g, '').replace(/,/g, '_')));
    const verifiedKeys = new Set([...citedKeys].filter(key => 
      artifacts.some(a => (a.metadata?.references as Record<string, unknown>)?.[key])
    ));
    
    return verifiedKeys.size / citedKeys.size;
  },
  verify: (value: number, target: number) => createKPICheck(value, target, 'eq')
});

kpiConfigs.set('cross_reference_consistency', {
  type: 'cross_reference_consistency',
  name: 'Cross-Reference Consistency',
  target: 1.0,
  measure: (artifacts: Artifact[]): number => {
    const refs: string[] = [];
    const resolved: string[] = [];
    
    for (const artifact of artifacts) {
      const content = artifact.content;
      const fileRefs = content.match(/@see\s+(\S+)|#(\w+)/g) || [];
      
      for (const ref of fileRefs) {
        refs.push(ref);
        const target = ref.replace(/@see\s+|#/, '').trim();
        if (artifacts.some(a => a.path.includes(target) || a.metadata?.id === target)) {
          resolved.push(ref);
        }
      }
    }
    
    if (refs.length === 0) return 1;
    return resolved.length / refs.length;
  },
  verify: (value: number, target: number) => createKPICheck(value, target, 'eq')
});

kpiConfigs.set('review_convergence', {
  type: 'review_convergence',
  name: 'Review Convergence',
  target: 2,
  measure: (_artifacts: Artifact[], workUnit?: WorkUnit): number => {
    if (!workUnit) return 0;
    return workUnit.inReviewAt ? 1 : 0;
  },
  verify: (value: number, target: number) => createKPICheck(value, target, 'lte')
});

kpiConfigs.set('first_draft_acceptance', {
  type: 'first_draft_acceptance',
  name: 'First-Draft Acceptance',
  target: 0.50,
  measure: (artifacts: Artifact[]): number => {
    const slices = artifacts.filter(a => a.metadata?.isSlice);
    if (slices.length === 0) return 1;
    
    const acceptedRound1 = slices.filter(a => a.metadata?.acceptedRound === 1).length;
    return acceptedRound1 / slices.length;
  },
  verify: (value: number, target: number) => createKPICheck(value, target, 'gte')
});

kpiConfigs.set('terminology_consistency', {
  type: 'terminology_consistency',
  name: 'Terminology Consistency',
  target: 0.95,
  measure: (artifacts: Artifact[]): number => {
    const allContent = artifacts.map(a => a.content).join(' ');
    
    const termCounts = new Map<string, number>();
    const words = allContent.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      if (word.length > 3) {
        termCounts.set(word, (termCounts.get(word) || 0) + 1);
      }
    }
    
    const sorted = [...termCounts.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return 1;
    
    const canonical = sorted[0][0];
    const canonicalUses = sorted[0][1];
    
    const variants = sorted.slice(1, 6).filter(([_, count]) => count >= canonicalUses * 0.3);
    const variantUses = variants.reduce((sum, [_, count]) => sum + count, 0);
    
    return canonicalUses / (canonicalUses + variantUses);
  },
  verify: (value: number, target: number) => createKPICheck(value, target, 'gte')
});

kpiConfigs.set('cycle_time', {
  type: 'cycle_time',
  name: 'Cycle Time',
  target: 0,
  measure: (_artifacts: Artifact[], workUnit?: WorkUnit): number => {
    if (!workUnit || !workUnit.startedAt || !workUnit.doneAt) return 0;
    return workUnit.doneAt - workUnit.startedAt;
  },
  verify: (_value: number, _target: number) => ({ passed: true, details: 'Tracked, no threshold' })
});

export function getKPIConfig(type: KPIType): KPIConfig | undefined {
  return kpiConfigs.get(type);
}

export function getAllKPIConfigs(): KPIConfig[] {
  return [...kpiConfigs.values()];
}

export function measureKPI(type: KPIType, artifacts: Artifact[], workUnit?: WorkUnit): KPIResult {
  const config = kpiConfigs.get(type);
  if (!config) {
    return {
      type,
      value: 0,
      target: 0,
      passed: false,
      details: `Unknown KPI type: ${type}`
    };
  }
  
  const value = config.measure(artifacts, workUnit);
  const verification = config.verify(value, config.target);
  
  return {
    type,
    value,
    target: config.target,
    passed: verification.passed,
    details: verification.details
  };
}

export function measureAllKPIs(artifacts: Artifact[], workUnit?: WorkUnit): KPIResult[] {
  return getAllKPIConfigs().map(config => 
    measureKPI(config.type, artifacts, workUnit)
  );
}