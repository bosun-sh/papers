# Bosun CLI Reference

Self-governance framework for AI coding agents.

## Commands

| Command | Description |
|---------|-------------|
| [init](init.md) | Initialize a new Bosun project |
| [status](status.md) | Show project status and OKR progress |
| [check](check.md) | Run DoD (Definition of Done) checks on artifacts |
| [probe](probe.md) | Run adversarial security probes on artifacts |
| [kpis](kpis.md) | Measure all 8 KPIs on artifacts |
| [categories](categories.md) | List available probe categories |
| help | Show this help or help for a specific command |

## Quick Start

```bash
# Initialize project
bosun init my-project

# Define OKRs in .bosun/config.json

# During development
bosun kpis src/**/*.ts    # Measure KPIs
bosun probe src/**/*.ts   # Run adversarial probes

# Before requesting review
bosun check src/**/*.ts  # Verify DoD
```

## Project Structure

```
.bosun/
├── config.json          # Project config (OKRs, KPIs)
├── docs/                # CLI documentation
│   ├── CLI.md           # This file
│   └── *.md             # Command references
AGENTS.md                # OpenCode/Claude rules
.claude/
└── CLAUDE.md            # Project-level agent config
```

## Key Concepts

- **KPIs**: 8 metrics tracked continuously (specification_adherence, citation_density, etc.)
- **OKRs**: Hierarchical objectives decomposed to KPI thresholds
- **DoD**: Machine-verifiable Definition of Done per state transition
- **Adversarial Probes**: 5 categories of self-testing (input_validation, security, etc.)