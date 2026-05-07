import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { 
  createProjectOKR, 
  verifyOKRProgress, 
  isOnTrack,
  createKeyResult 
} from '../okr/index.js';
import { createDoD, verifyDoD, defaultDoD } from '../dod/index.js';
import { runAdversarialProbes, getProbeCategories } from '../adversarial/index.js';
import { measureAllKPIs } from '../kpis/index.js';
import type { KPIType, Artifact, WorkUnit } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = join(__dirname, 'docs');
const fallbackDocsDir = join(__dirname, '..', 'cli', 'docs');

function getDocsDir(): string {
  const cwdDocs = join(process.cwd(), '.bosun', 'docs');
  if (existsSync(cwdDocs)) {
    return cwdDocs;
  }
  if (existsSync(docsDir)) {
    return docsDir;
  }
  return fallbackDocsDir;
}

function getConfigPath(): string {
  const newConfigPath = join(process.cwd(), '.bosun', 'config.json');
  const oldConfigPath = join(process.cwd(), '.bosunrc.json');
  if (existsSync(newConfigPath)) {
    return newConfigPath;
  }
  if (existsSync(oldConfigPath)) {
    return oldConfigPath;
  }
  return newConfigPath;
}

const program = new Command();

program
  .name('bosun')
  .description('Mini-Bosun: Self-governance framework for AI coding agents')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize a new Bosun project')
  .argument('<name>', 'Project name')
  .option('-o, --okr <file>', 'OKR definition file (JSON)')
  .action(async (name, options) => {
    const project = createProjectOKR(
      `project-${Date.now()}`,
      name,
      []
    );
    
    const bosunDir = join(process.cwd(), '.bosun');
    if (!existsSync(bosunDir)) {
      mkdirSync(bosunDir, { recursive: true });
    }
    
    const configPath = join(bosunDir, 'config.json');
    const config = {
      project,
      createdAt: Date.now()
    };
    
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✓ Project "${name}" initialized`);
    console.log(`  Config saved to: ${configPath}`);
    
    const docsTargetDir = join(bosunDir, 'docs');
    if (!existsSync(docsTargetDir)) {
      mkdirSync(docsTargetDir, { recursive: true });
      const docFiles = ['CLI.md', 'init.md', 'status.md', 'check.md', 'probe.md', 'kpis.md', 'categories.md'];
      for (const docFile of docFiles) {
        const src = join(docsDir, docFile);
        if (existsSync(src)) {
          cpSync(src, join(docsTargetDir, docFile));
        }
      }
      console.log(`  Docs saved to: ${docsTargetDir}/`);
    }
    
    const agentsPath = join(process.cwd(), 'AGENTS.md');
    const agentsContent = `# Bosun Self-Governance

This project uses Bosun for AI agent self-governance.

## Available Commands
- \`bosun init <name>\` - Initialize project
- \`bosun status\` - Show OKR progress
- \`bosun check <files>\` - Run DoD checks
- \`bosun probe <files>\` - Run adversarial probes
- \`bosun kpis <files>\` - Measure 8 KPIs
- \`bosun categories\` - List probe categories
- \`bosun help\` - Show help

See .bosun/docs/CLI.md for details.
`;
    writeFileSync(agentsPath, agentsContent);
    console.log(`  Agent rules saved to: ${agentsPath}`);
    
    const claudeDir = join(process.cwd(), '.claude');
    if (!existsSync(claudeDir)) {
      mkdirSync(claudeDir, { recursive: true });
    }
    const claudePath = join(claudeDir, 'CLAUDE.md');
    const claudeContent = `# Bosun Framework

This project uses the Bosun self-governance framework for AI coding agents.

## Quick Reference

Run \`bosun help\` for CLI commands.
See .bosun/docs/CLI.md for full documentation.

## Core Concepts

- **KPIs**: 8 metrics tracked continuously
- **OKRs**: Hierarchical objectives with KPI thresholds
- **DoD**: Machine-verifiable Definition of Done
- **Adversarial Probes**: 5 categories of self-testing
`;
    writeFileSync(claudePath, claudeContent);
    console.log(`  Agent config saved to: ${claudePath}`);
  });

program
  .command('status')
  .description('Show current project status and KPIs')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    const configPath = getConfigPath();
    
    if (!existsSync(configPath)) {
      console.error('✗ No Bosun project found. Run "bosun init <name>" first.');
      process.exit(1);
    }
    
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    
    const output = {
      project: config.project.name,
      onTrack: true,
      objectives: config.project.objectives.map((obj: { id: string; description: string; keyResults: { kpi: string; threshold: number }[] }) => ({
        id: obj.id,
        description: obj.description,
        keyResults: obj.keyResults.map(kr => ({
          kpi: kr.kpi,
          threshold: kr.threshold
        }))
      }))
    };
    
    if (options.json) {
      console.log(JSON.stringify(output, null, 2));
    } else {
      console.log(`\n## ${output.project}\n`);
      console.log(`Status: ${output.onTrack ? '✓ On Track' : '✗ Off Track'}\n`);
      console.log('Objectives:');
      for (const obj of output.objectives) {
        console.log(`  - ${obj.description}`);
        for (const kr of obj.keyResults) {
          console.log(`      → ${kr.kpi} ≥ ${kr.threshold}`);
        }
      }
    }
  });

program
  .command('check')
  .description('Run DoD check on artifacts')
  .argument('<file...>', 'Files to check')
  .option('-d, --dod <name>', 'DoD name to use', 'default')
  .action(async (files, options) => {
    const artifacts: Artifact[] = files.map((file: string) => ({
      id: file,
      type: 'file' as const,
      path: file,
      content: existsSync(file) ? readFileSync(file, 'utf-8') : '',
      metadata: {}
    }));
    
    const dod = options.dod === 'default' ? defaultDoD : createDoD(options.dod, []);
    const result = verifyDoD(dod, artifacts);
    
    console.log(`\n## DoD Check: ${dod.name}\n`);
    for (const item of result.results) {
      const icon = item.passed ? '✓' : '✗';
      console.log(`${icon} ${item.details}`);
    }
    console.log(`\nResult: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
  });

program
  .command('probe')
  .description('Run adversarial probes on artifacts')
  .argument('<file...>', 'Files to probe')
  .option('-c, --category <cat>', 'Probe category (input_validation, security, error_handling, edge_cases, performance)')
  .action(async (files, options) => {
    const artifacts: Artifact[] = files.map((file: string) => ({
      id: file,
      type: 'file' as const,
      path: file,
      content: existsSync(file) ? readFileSync(file, 'utf-8') : '',
      metadata: {}
    }));
    
    const category = options.category as KPIType | undefined;
    const results = runAdversarialProbes(artifacts, category as any);
    
    console.log('\n## Adversarial Probe Results\n');
    
    const byCategory = new Map<string, typeof results>();
    for (const probe of results) {
      const existing = byCategory.get(probe.category) || [];
      existing.push(probe);
      byCategory.set(probe.category, existing);
    }
    
    let passed = 0;
    for (const [cat, probes] of byCategory) {
      console.log(`### ${cat.replace('_', ' ').toUpperCase()}`);
      for (const p of probes) {
        const icon = p.passed ? '✓' : '✗';
        console.log(`  ${icon} ${p.name}: ${p.details}`);
        if (p.passed) passed++;
      }
      console.log('');
    }
    
    console.log(`Total: ${passed}/${results.length} passed`);
  });

program
  .command('kpis')
  .description('Measure all KPIs on artifacts')
  .argument('<file...>', 'Files to measure')
  .action(async (files) => {
    const artifacts: Artifact[] = files.map((file: string) => ({
      id: file,
      type: 'file' as const,
      path: file,
      content: existsSync(file) ? readFileSync(file, 'utf-8') : '',
      metadata: {}
    }));
    
    const results = measureAllKPIs(artifacts);
    
    console.log('\n## KPI Measurements\n');
    
    for (const kpi of results) {
      const icon = kpi.passed ? '✓' : '✗';
      console.log(`${icon} **${kpi.type}**`);
      console.log(`   Value: ${kpi.value.toFixed(3)}`);
      console.log(`   Target: ${kpi.target}`);
      console.log(`   ${kpi.details}\n`);
    }
    
    const allPassed = results.every(r => r.passed);
    console.log(`Overall: ${allPassed ? '✓ All KPIs met' : '✗ Some KPIs below threshold'}`);
  });

program
  .command('categories')
  .description('List available probe categories')
  .action(() => {
    const categories = getProbeCategories();
    console.log('\n## Probe Categories\n');
    for (const cat of categories) {
      console.log(`  - ${cat}`);
    }
  });

const validCommands = ['init', 'status', 'check', 'probe', 'kpis', 'categories', 'help'];

program
  .command('help')
  .description('Show help for Bosun CLI')
  .argument('[command]', 'Command to get help for')
  .action((cmd) => {
    if (cmd && validCommands.includes(cmd)) {
      const docPath = join(getDocsDir(), `${cmd}.md`);
      if (existsSync(docPath)) {
        console.log(readFileSync(docPath, 'utf-8'));
      } else {
        console.log(`No documentation found for "${cmd}"`);
      }
    } else {
      console.log(`
# Bosun CLI Help

## Commands

| Command | Description |
|---------|-------------|
| init | Initialize a new Bosun project |
| status | Show project status and OKR progress |
| check | Run DoD checks on artifacts |
| probe | Run adversarial probes on artifacts |
| kpis | Measure all 8 KPIs on artifacts |
| categories | List available probe categories |
| help | Show this help |

## Usage

Run \`bosun help <command>\` for detailed help on a specific command.
Run \`bosun <command> --help\` for command options.

## See Also

.bosun/docs/CLI.md - Full CLI reference
`);
    }
  });

program.parse();