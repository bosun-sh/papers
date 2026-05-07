# BOSUN.md - Mini-Bosun Framework

## Overview

Bosun is a self-governance framework for AI coding agents that replaces real-time human checkpoints with structured agent self-regulation. It eliminates the intervention penalty—the cumulative productivity cost of human interruptions.

## Core Principles

1. **Human role is architectural, not operational** — Humans define objectives, KPI targets, and Definition of Done (DoD) before work begins; they do not approve individual actions during execution.

2. **All quality gates must be machine-verifiable** — Only criteria expressible as deterministic computations over artifacts are admitted.

3. **Governance overhead must be less than intervention overhead** — Self-governance overhead is constant per state transition; intervention overhead scales superlinearly with frequency.

4. **Adversarial testing is continuous, not periodic** — Agents red-team their own work at every state transition.

---

## Getting Started

### Initialize a Project

```bash
bosun init my-project
```

This creates a `.bosunrc.json` config file in the current directory.

### Define OKRs

Edit `.bosunrc.json` to add objectives and key results:

```json
{
  "project": {
    "projectId": "project-1",
    "name": "My Project",
    "objectives": [
      {
        "id": "obj-1",
        "description": "Build user authentication",
        "keyResults": [
          {
            "id": "kr-1",
            "description": "Specification adherence ≥ 90%",
            "kpi": "specification_adherence",
            "threshold": 0.90,
            "measurementMethod": "requirements_met / total_requirements"
          }
        ]
      }
    ]
  }
}
```

---

## Available KPIs

| KPI | Formula | Target |
|-----|---------|--------|
| Specification Adherence | `requirements_met / total_requirements` | ≥ 0.90 |
| Citation Density | `citations / (words / 250)` | ≥ 2.0 per 250 words |
| Citation Integrity | `verified_cited_keys / total_cited_keys` | = 1.0 |
| Cross-Reference Consistency | `resolved_refs / total_refs` | = 1.0 |
| Review Convergence | Round number when status reaches `done` | ≤ 2 rounds |
| First-Draft Acceptance | `slices_accepted_round_1 / total_slices` | ≥ 0.50 |
| Terminology Consistency | `canonical_uses / (canonical_uses + variant_uses)` | ≥ 0.95 |
| Cycle Time | `t_done - t_in_progress` | Tracked (no threshold) |

---

## CLI Commands

### `bosun status`

Show current project status and OKR progress.

### `bosun check <files...>`

Run DoD check on specified files. Validates:
- All acceptance criteria met
- No TODO/FIXME comments remaining
- Tests present
- Code compiles

### `bosun probe <files...>`

Run adversarial probes on artifacts. Categories:
- `input_validation` - Empty inputs, type checking, boundary values
- `security` - Injection prevention, credential exposure
- `error_handling` - Try-catch, logging, fallbacks
- `edge_cases` - Empty states, duplicates, concurrency
- `performance` - Resource cleanup, data structures, loops

### `bosun kpis <files...>`

Measure all 8 KPIs on specified artifacts.

### `bosun categories`

List available probe categories.

---

## Integration with Logbook

The framework integrates with `@bosun-sh/logbook` for task management. Work units flow through states:

```
todo → in_progress → pending_review → done
         ↑                ↓
         └──── blocked ←─┘
```

DoD checks run automatically on `in_progress → pending_review` transitions.

Adversarial probes run on `pending_review → done` transitions.

---

## DoD Checklist

The default DoD includes:

1. All acceptance criteria met
2. No TODO comments remaining
3. Tests pass
4. Code compiles without errors

You can create custom DoDs using the API:

```typescript
import { createDoD } from './dod/index.js';

const myDoD = createDoD('Custom DoD', [
  {
    description: 'Custom check',
    check: (artifacts) => artifacts.length > 0
  }
]);
```

---

## Adversarial Testing

At each state transition, run adversarial probes across five categories:

1. **Input validation** - Malformed inputs, boundary values
2. **Security** - Injection vectors, credential exposure, unsafe operations
3. **Error handling** - Exception paths, failure modes
4. **Edge cases** - Corner conditions, empty states
5. **Performance** - Resource limits, complexity bounds

---

## When Humans ARE Needed

- Security review
- Compliance verification
- Novel-domain decisions (irreversible consequences, genuinely require human judgment)

---

## Architecture

```
Human Input
    │
    ▼
┌─────────────────────────────────────┐
│  Define OKRs, KPIs, DoD             │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  Task Input                         │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  OKR Decomposition                  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  todo → in_progress → done         │
│  (with KPI Monitoring continuous)   │
└─────────────────────────────────────┘
    │
    ├── Adversarial Testing (at each transition)
    │
    └── DoD Check
         ├── fail → revise → in_progress
         └── pass → advance
```

---

## Example Workflow

1. **Define project OKRs** in `.bosunrc.json`
2. **Initialize task** in logbook (status: `todo`)
3. **Start work** - transition to `in_progress`
4. **Run self-checks** - `bosun kpis <files>` and `bosun probe <files>`
5. **Request review** - transition to `pending_review` (DoD checks run)
6. **Complete** - transition to `done` (adversarial probes run)