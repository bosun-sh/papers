import type { ProbeCategory, ProbeResult, Artifact, ProbeDefinition } from '../types.js';

const inputValidationProbes: ProbeDefinition[] = [
  {
    id: 'iv-1',
    category: 'input_validation',
    name: 'Empty input handling',
    description: 'Test that the system handles empty/missing inputs gracefully',
    execute: (artifacts: Artifact[]): ProbeResult => {
      const hasEmptyChecks = artifacts.some(a => 
        a.content.includes('if (!input)') ||
        a.content.includes('if (input === null)') ||
        a.content.includes('if (!args)') ||
        a.content.includes('nullish')
      );
      
      return {
        id: 'iv-1',
        category: 'input_validation',
        name: 'Empty input handling',
        passed: hasEmptyChecks,
        details: hasEmptyChecks ? 'Empty input checks present' : 'No explicit empty input handling found'
      };
    }
  },
  {
    id: 'iv-2',
    category: 'input_validation',
    name: 'Type checking',
    description: 'Verify proper type validation on function inputs',
    execute: (artifacts: Artifact[]): ProbeResult => {
      const hasTypeChecks = artifacts.some(a => 
        a.content.includes('typeof') ||
        a.content.includes('instanceof') ||
        a.content.includes('isArray') ||
        a.content.includes(': string') ||
        a.content.includes(': number') ||
        a.content.includes(': boolean')
      );
      
      return {
        id: 'iv-2',
        category: 'input_validation',
        name: 'Type checking',
        passed: hasTypeChecks,
        details: hasTypeChecks ? 'Type checking present' : 'No type validation found'
      };
    }
  },
  {
    id: 'iv-3',
    category: 'input_validation',
    name: 'Boundary value handling',
    description: 'Check for handling of boundary values',
    execute: (artifacts: Artifact[]): ProbeResult => {
      const hasBoundaryChecks = artifacts.some(a => 
        a.content.includes('<= 0') ||
        a.content.includes('>= 0') ||
        a.content.includes('< 0') ||
        a.content.includes('> 0') ||
        a.content.includes('MAX_') ||
        a.content.includes('MIN_')
      );
      
      return {
        id: 'iv-3',
        category: 'input_validation',
        name: 'Boundary value handling',
        passed: hasBoundaryChecks,
        details: hasBoundaryChecks ? 'Boundary value checks present' : 'No boundary value handling found'
      };
    }
  }
];

const securityProbes: ProbeDefinition[] = [
  {
    id: 'sec-1',
    category: 'security',
    name: 'Injection prevention',
    description: 'Check for SQL/command injection vulnerabilities',
    execute: (artifacts: Artifact[]): ProbeResult => {
      const dangerous = artifacts.filter(a => 
        a.content.includes('exec') ||
        a.content.includes('eval') ||
        a.content.includes('query') ||
        a.content.includes('sql')
      );
      
      if (dangerous.length === 0) {
        return {
          id: 'sec-1',
          category: 'security',
          name: 'Injection prevention',
          passed: true,
          details: 'No dangerous patterns detected'
        };
      }
      
      const hasParameterized = artifacts.some(a => 
        a.content.includes('parameterized') ||
        a.content.includes('$') ||
        a.content.includes('placeholder') ||
        a.content.includes('bind')
      );
      
      return {
        id: 'sec-1',
        category: 'security',
        name: 'Injection prevention',
        passed: hasParameterized,
        details: hasParameterized ? 'Parameterized queries present' : 'Potential injection risk - no parameterization found'
      };
    }
  },
  {
    id: 'sec-2',
    category: 'security',
    name: 'Credential exposure',
    description: 'Check for hardcoded secrets or credentials',
    execute: (artifacts: Artifact[]): ProbeResult => {
      const hasCredentials = artifacts.some(a => {
        const content = a.content.toLowerCase();
        return (
          content.includes('api_key') ||
          content.includes('secret') ||
          content.includes('password') ||
          content.includes('token') ||
          content.includes('apikey')
        ) && (
          content.includes('=') ||
          content.includes(':')
        );
      });
      
      const usesEnvVars = artifacts.some(a => 
        a.content.includes('process.env') ||
        a.content.includes('Deno.env') ||
        a.content.includes('os.environ') ||
        a.content.includes('config') && a.content.includes('env')
      );
      
      return {
        id: 'sec-2',
        category: 'security',
        name: 'Credential exposure',
        passed: !hasCredentials || usesEnvVars,
        details: hasCredentials && !usesEnvVars 
          ? 'WARNING: Potential hardcoded credentials found' 
          : 'No hardcoded credentials detected'
      };
    }
  },
  {
    id: 'sec-3',
    category: 'security',
    name: 'Unsafe operation protection',
    description: 'Check for unsafe file/system operations',
    execute: (artifacts: Artifact[]): ProbeResult => {
      const unsafeOps = ['fs.writeFileSync', 'fs.writeFile', 'rm -rf', 'shell.exec', 'child_process'];
      const hasUnsafe = artifacts.some(a => 
        unsafeOps.some(op => a.content.includes(op))
      );
      
      if (!hasUnsafe) {
        return {
          id: 'sec-3',
          category: 'security',
          name: 'Unsafe operation protection',
          passed: true,
          details: 'No unsafe file operations detected'
        };
      }
      
      const hasValidation = artifacts.some(a => 
        a.content.includes('validate') ||
        a.content.includes('sanitize') ||
        a.content.includes('check')
      );
      
      return {
        id: 'sec-3',
        category: 'security',
        name: 'Unsafe operation protection',
        passed: hasValidation,
        details: hasValidation 
          ? 'Unsafe ops present with validation' 
          : 'Unsafe operations without clear validation'
      };
    }
  }
];

const errorHandlingProbes: ProbeDefinition[] = [
  {
    id: 'eh-1',
    category: 'error_handling',
    name: 'Exception handling',
    description: 'Check for try-catch or error handling blocks',
    execute: (artifacts: Artifact[]): ProbeResult => {
      const hasTryCatch = artifacts.some(a => 
        a.content.includes('try') && a.content.includes('catch')
      );
      
      return {
        id: 'eh-1',
        category: 'error_handling',
        name: 'Exception handling',
        passed: hasTryCatch,
        details: hasTryCatch ? 'Try-catch blocks present' : 'No try-catch blocks found'
      };
    }
  },
  {
    id: 'eh-2',
    category: 'error_handling',
    name: 'Error logging',
    description: 'Verify error logging mechanism exists',
    execute: (artifacts: Artifact[]): ProbeResult => {
      const hasLogging = artifacts.some(a => 
        a.content.includes('console.error') ||
        a.content.includes('logger.error') ||
        a.content.includes('log.error') ||
        a.content.includes('throw')
      );
      
      return {
        id: 'eh-2',
        category: 'error_handling',
        name: 'Error logging',
        passed: hasLogging,
        details: hasLogging ? 'Error logging present' : 'No error logging found'
      };
    }
  },
  {
    id: 'eh-3',
    category: 'error_handling',
    name: 'Graceful degradation',
    description: 'Check for fallback behavior on errors',
    execute: (artifacts: Artifact[]): ProbeResult => {
      const hasFallback = artifacts.some(a => 
        a.content.includes('fallback') ||
        a.content.includes('default') ||
        a.content.includes('catch') && a.content.includes('return') ||
        a.content.includes('||')
      );
      
      return {
        id: 'eh-3',
        category: 'error_handling',
        name: 'Graceful degradation',
        passed: hasFallback,
        details: hasFallback ? 'Fallback behavior present' : 'No fallback behavior found'
      };
    }
  }
];

const edgeCaseProbes: ProbeDefinition[] = [
  {
    id: 'ec-1',
    category: 'edge_cases',
    name: 'Empty state handling',
    description: 'Check for handling of empty arrays/collections',
    execute: (artifacts: Artifact[]): ProbeResult => {
      const hasEmptyCheck = artifacts.some(a => 
        a.content.includes('.length === 0') ||
        a.content.includes('.length == 0') ||
        a.content.includes('isEmpty') ||
        a.content.includes('empty?')
      );
      
      return {
        id: 'ec-1',
        category: 'edge_cases',
        name: 'Empty state handling',
        passed: hasEmptyCheck,
        details: hasEmptyCheck ? 'Empty state checks present' : 'No empty state handling found'
      };
    }
  },
  {
    id: 'ec-2',
    category: 'edge_cases',
    name: 'Duplicate handling',
    description: 'Check for duplicate entry handling',
    execute: (artifacts: Artifact[]): ProbeResult => {
      const hasDedupe = artifacts.some(a => 
        a.content.includes('Set(') ||
        a.content.includes('unique') ||
        a.content.includes('distinct') ||
        a.content.includes('deduplicate') ||
        a.content.includes('dedup')
      );
      
      return {
        id: 'ec-2',
        category: 'edge_cases',
        name: 'Duplicate handling',
        passed: hasDedupe,
        details: hasDedupe ? 'Duplicate handling present' : 'No explicit duplicate handling found'
      };
    }
  },
  {
    id: 'ec-3',
    category: 'edge_cases',
    name: 'Concurrent access handling',
    description: 'Check for race condition prevention',
    execute: (artifacts: Artifact[]): ProbeResult => {
      const hasConcurrency = artifacts.some(a => 
        a.content.includes('lock') ||
        a.content.includes('mutex') ||
        a.content.includes('semaphore') ||
        a.content.includes('atomic') ||
        a.content.includes('synchronized')
      );
      
      return {
        id: 'ec-3',
        category: 'edge_cases',
        name: 'Concurrent access handling',
        passed: hasConcurrency,
        details: hasConcurrency 
          ? 'Concurrency controls present' 
          : 'No explicit concurrency controls (may not be needed)'
      };
    }
  }
];

const performanceProbes: ProbeDefinition[] = [
  {
    id: 'perf-1',
    category: 'performance',
    name: 'Resource cleanup',
    description: 'Check for proper resource disposal',
    execute: (artifacts: Artifact[]): ProbeResult => {
      const hasCleanup = artifacts.some(a => 
        a.content.includes('finally') ||
        a.content.includes('.close()') ||
        a.content.includes('.dispose()') ||
        a.content.includes('cleanup')
      );
      
      return {
        id: 'perf-1',
        category: 'performance',
        name: 'Resource cleanup',
        passed: hasCleanup,
        details: hasCleanup ? 'Resource cleanup present' : 'No explicit resource cleanup found'
      };
    }
  },
  {
    id: 'perf-2',
    category: 'performance',
    name: 'Efficient data structures',
    description: 'Check for use of appropriate data structures',
    execute: (artifacts: Artifact[]): ProbeResult => {
      const hasMapOrSet = artifacts.some(a => 
        a.content.includes('new Map') ||
        a.content.includes('new Set') ||
        a.content.includes('HashMap') ||
        a.content.includes('HashSet')
      );
      
      return {
        id: 'perf-2',
        category: 'performance',
        name: 'Efficient data structures',
        passed: true,
        details: hasMapOrSet 
          ? 'Efficient data structures available' 
          : 'Standard structures used (may be appropriate)'
      };
    }
  },
  {
    id: 'perf-3',
    category: 'performance',
    name: 'Loop optimization',
    description: 'Check for inefficient loops or operations',
    execute: (artifacts: Artifact[]): ProbeResult => {
      const nestedLoops = artifacts.filter(a => {
        const content = a.content;
        const loopPattern = /for\s*\([^)]+\)\s*{[^}]*for\s*\(/g;
        return content.match(loopPattern);
      });
      
      return {
        id: 'perf-3',
        category: 'performance',
        name: 'Loop optimization',
        passed: nestedLoops.length <= 1,
        details: nestedLoops.length > 1 
          ? `Found ${nestedLoops.length} nested loops - potential performance issue` 
          : 'No obvious nested loop issues'
      };
    }
  }
];

const allProbes = [
  ...inputValidationProbes,
  ...securityProbes,
  ...errorHandlingProbes,
  ...edgeCaseProbes,
  ...performanceProbes
];

export function runAdversarialProbes(
  artifacts: Artifact[],
  category?: ProbeCategory
): ProbeResult[] {
  const probes = category 
    ? allProbes.filter(p => p.category === category)
    : allProbes;
  
  return probes.map(probe => probe.execute(artifacts));
}

export function runCategoryProbes(
  category: ProbeCategory,
  artifacts: Artifact[]
): ProbeResult[] {
  return runAdversarialProbes(artifacts, category);
}

export function getProbeCategories(): ProbeCategory[] {
  return ['input_validation', 'security', 'error_handling', 'edge_cases', 'performance'];
}

export function getProbeCount(): Map<ProbeCategory, number> {
  const counts = new Map<ProbeCategory, number>();
  for (const cat of getProbeCategories()) {
    counts.set(cat, allProbes.filter(p => p.category === cat).length);
  }
  return counts;
}

export function generateProbeSuite(): ProbeDefinition[] {
  return allProbes;
}