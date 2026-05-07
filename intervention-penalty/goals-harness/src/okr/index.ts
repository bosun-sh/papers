import type { 
  ProjectOKR, 
  SectionOKR, 
  Objective, 
  KeyResult, 
  WorkUnit, 
  OKRStatus,
  KPIType,
  KPIResult
} from '../types.js';
import { measureKPI } from '../kpis/index.js';

export function decomposeOKR(projectOKR: ProjectOKR): SectionOKR[] {
  const sections: SectionOKR[] = [];
  
  for (const objective of projectOKR.objectives) {
    const section: SectionOKR = {
      sectionId: `${projectOKR.projectId}-${objective.id}`,
      name: objective.description,
      parentObjective: objective.id,
      keyResults: objective.keyResults
    };
    sections.push(section);
  }
  
  return sections;
}

export function mapToWorkUnitKR(
  keyResult: KeyResult,
  workUnit: WorkUnit
): { kpi: KPIType; current: number; target: number } {
  const kpiResult = measureKPI(keyResult.kpi, workUnit.artifacts, workUnit);
  
  return {
    kpi: keyResult.kpi,
    current: kpiResult.value,
    target: keyResult.threshold
  };
}

export function verifyOKRProgress(
  projectOKR: ProjectOKR,
  workUnits: WorkUnit[]
): OKRStatus[] {
  const statuses: OKRStatus[] = [];
  
  for (const objective of projectOKR.objectives) {
    const keyResultStatuses: OKRStatus['keyResults'] = [];
    let allOnTrack = true;
    
    for (const keyResult of objective.keyResults) {
      const relevantWorkUnits = workUnits.filter(
        w => w.artifacts.length > 0
      );
      
      let currentValue = 0;
      if (keyResult.kpi === 'cycle_time') {
        currentValue = relevantWorkUnits.reduce(
          (sum, w) => sum + (w.doneAt && w.startedAt ? w.doneAt - w.startedAt : 0),
          0
        ) / (relevantWorkUnits.length || 1);
      } else {
        const kpiValues = relevantWorkUnits.map(w => 
          measureKPI(keyResult.kpi, w.artifacts, w).value
        );
        currentValue = kpiValues.reduce((a, b) => a + b, 0) / (kpiValues.length || 1);
      }
      
      const passed = keyResult.kpi === 'cycle_time' 
        ? true 
        : currentValue >= keyResult.threshold;
      
      if (!passed) allOnTrack = false;
      
      keyResultStatuses.push({
        keyResultId: keyResult.id,
        current: currentValue,
        target: keyResult.threshold,
        passed
      });
    }
    
    statuses.push({
      objectiveId: objective.id,
      onTrack: allOnTrack,
      keyResults: keyResultStatuses
    });
  }
  
  return statuses;
}

export function isOnTrack(projectOKR: ProjectOKR, workUnits: WorkUnit[]): boolean {
  const statuses = verifyOKRProgress(projectOKR, workUnits);
  return statuses.every(s => s.onTrack);
}

export function getKPIThresholdsForWorkUnit(
  projectOKR: ProjectOKR
): Map<string, { kpi: KPIType; threshold: number }[]> {
  const thresholds = new Map<string, { kpi: KPIType; threshold: number }[]>();
  
  for (const objective of projectOKR.objectives) {
    const workUnitId = `${projectOKR.projectId}-${objective.id}`;
    thresholds.set(
      workUnitId,
      objective.keyResults.map(kr => ({ kpi: kr.kpi, threshold: kr.threshold }))
    );
  }
  
  return thresholds;
}

export function createProjectOKR(
  projectId: string,
  name: string,
  objectives: Omit<Objective, 'id'>[]
): ProjectOKR {
  return {
    projectId,
    name,
    objectives: objectives.map((obj, idx) => ({
      ...obj,
      id: `obj-${idx + 1}`
    }))
  };
}

export function createKeyResult(
  description: string,
  kpi: KPIType,
  threshold: number,
  measurementMethod: string
): KeyResult {
  return {
    id: `kr-${Math.random().toString(36).substr(2, 9)}`,
    description,
    kpi,
    threshold,
    measurementMethod
  };
}