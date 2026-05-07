# AI in Cybersecurity: Reproducibility Package

This repository contains the reproducibility artifacts for the paper:

**"Artificial Intelligence in Cybersecurity: Reproducible Evidence on Vulnerability Discovery and Security Operations"**

- **Authors:** Sofia Plajutin, Julian Ramirez
- **Affiliation:** bosun.sh — AI-Native Tech Lab
- **Date:** 2026-04-04

## Repository Structure

```
ai-cybersecurity-reproducibility/
├── README.md                 # This file
├── data/
│   ├── evidence-matrix.csv   # Main evidence tracking (all claims → sources)
│   └── evidence-map.csv      # Task-level classification data
└── scripts/
    ├── reproduce_analysis.py # Reproducibility entrypoint
    └── generate_figures.py   # Figure generation from evidence data
```

## Quick Start

### 1. Validate Evidence Tables

```bash
cd scripts
python reproduce_analysis.py
```

This validates the evidence matrices and runs integrity checks on the manuscript citations.

### 2. Regenerate Figures

```bash
python generate_figures.py
```

Generates Figure 1 from the evidence-matrix.csv data.

## File Descriptions

### `data/evidence-matrix.csv`

Each row links a manuscript claim to its source. Columns:
- Section (manuscript section)
- Source key (bibliography reference)
- Source type (empirical/systematic/advisory)
- Verification status
- Access date
- Claim type (direct/inferred)

### `data/evidence-map.csv`

Task-level classification for cybersecurity tasks. Columns:
- Task class
- Evidence strength
- Source-mix quality
- Operational maturity
- Governance burden
- Best-supported deployment mode

### `scripts/reproduce_analysis.py`

Deterministic entrypoint that:
- Validates checked-in evidence tables
- Reruns manuscript integrity checks
- Emits a compact reproducibility report

### `scripts/generate_figures.py`

Generates figure assets from evidence data without introducing new data.

## Citation

If you use this reproducibility package, please cite the main paper:

```
Plajutin, S., & Ramirez, J. I. (2026). Artificial Intelligence in Cybersecurity: Reproducible Evidence on Vulnerability Discovery and Security Operations. Zenodo. https://doi.org/10.5281/zenodo.19463970
```

## License

MIT License
