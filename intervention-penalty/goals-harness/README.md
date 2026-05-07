# mini-bosun

A minimal self-governance framework for AI coding agents that eliminates the intervention penalty—the cumulative productivity cost of human interruptions during agent execution.

Based on research from *Ramirez, J., & Plajutin, S. (2026). The Intervention Penalty: A Simulation Study of Human Checkpoint Costs in AI Coding Governance. Zenodo. https://doi.org/10.5281/zenodo.19457265*.

## The Problem

When humans are in the loop for AI agent workflows, each checkpoint creates an **intervention penalty**:

- Context switching costs (human must re-orient to the task)
- Communication overhead (explaining what's been done, what's pending)
- Latency delays (waiting for human availability)
- Psychological friction (both agent and human feel interrupted)

These costs scale superlinearly with checkpoint frequency. The more human oversight, the slower the agent.

## The Solution

**Bosun replaces human checkpoints with structured agent self-regulation.**

Instead of pausing for human approval at each step, agents work against pre-defined, machine-verifiable criteria:

1. **OKRs** define what success looks like
2. **KPIs** measure progress automatically
3. **Definition of Done (DoD)** validates completion
4. **Adversarial probes** catch edge cases and vulnerabilities

Human role becomes **architectural** (defining objectives upfront) rather than **operational** (approving each action).

## Core Principles

1. **Human role is architectural, not operational** — Define objectives and success criteria before work begins; don't approve during execution.

2. **All quality gates must be machine-verifiable** — Only criteria expressible as deterministic computations are admitted.

3. **Governance overhead must be less than intervention overhead** — Self-governance overhead is constant per transition; intervention overhead scales superlinearly.

4. **Adversarial testing is continuous, not periodic** — Agents red-team their own work at every state transition.

## Quick Start

```bash
# Install
npm install mini-bosun

# Initialize project
bosun init my-project

# Define OKRs in .bosunrc.json
```

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
    ├── DoD Check (at pending_review)
    └── Adversarial Probes (at done)
```

## Key Features

### 8 Built-in KPIs

| KPI | Target | Purpose |
|-----|--------|---------|
| Specification Adherence | ≥ 90% | Requirements met |
| Citation Density | ≥ 2.0/250 words | Documentation quality |
| Citation Integrity | = 100% | References valid |
| Cross-Reference Consistency | = 100% | Links resolved |
| Review Convergence | ≤ 2 rounds | Review efficiency |
| First-Draft Acceptance | ≥ 50% | Initial quality |
| Terminology Consistency | ≥ 95% | Language uniformity |
| Cycle Time | tracked | Turnaround time |

### Definition of Done

Default checks:
- All acceptance criteria met
- No TODO/FIXME comments remaining
- Tests present
- Code compiles

Custom DoDs supported—define your own checklist items.

### Adversarial Probes

5 categories of automated testing at each transition:

- **Input validation** — Empty inputs, type checking, boundary values
- **Security** — Injection prevention, credential exposure, unsafe ops
- **Error handling** — Try-catch, logging, fallbacks
- **Edge cases** — Empty states, duplicates, concurrency
- **Performance** — Resource cleanup, data structures, loops

### Logbook Integration

State machine for work units:

```
todo → in_progress → pending_review → done
         ↑                ↓
         └──── blocked ←─┘
```

DoD checks run on `in_progress → pending_review`.
Adversarial probes run on `pending_review → done`.

## CLI Commands

```bash
bosun status              # Show project status and OKR progress
bosun check <files...>    # Run DoD validation
bosun probe <files...>    # Run adversarial probes
bosun kpis <files...>     # Measure all 8 KPIs
bosun categories          # List probe categories
```

## When Humans Are Still Needed

- Security review (architectural, not per-change)
- Compliance verification
- Novel-domain decisions with irreversible consequences

## This vs Full Bosun

| | mini-bosun | Full Bosun |
|---|---|---|
| Implementation | Minimal (this repo) | Full product |
| Integration | CLI + programmatic | Telegram, Desktop, cloud |
| Complexity | Core concepts only | Production-ready |
| Scope | ~200 lines of core code | Full feature set |

Use **mini-bosun** to understand the framework or embed in other tools.

Use **full Bosun** (bosun.engineer) for production deployments.

## Documentation

- [BOSUN.md](./BOSUN.md) — Full technical specification
- [CLI Docs](./src/cli/docs/) — Detailed command reference
- [API Docs](./src/) — TypeScript module documentation

## License

MIT
