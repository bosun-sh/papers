# bosun status

Show project status and OKR progress.

## Usage

```bash
bosun status [options]
```

## Options

| Option | Description |
|--------|-------------|
| `-j, --json` | Output as JSON |

## Description

Displays:
- Project name
- On-track status (based on KPI thresholds)
- Objectives and their key results

## Example

```bash
$ bosun status

## my-project

Status: ✓ On Track

Objectives:
  - Build authentication
      → specification_adherence ≥ 0.9
      → cycle_time ≤ 3600000
```

## JSON Output

```bash
$ bosun status --json
{
  "project": "my-project",
  "onTrack": true,
  "objectives": [...]
}
```

## See Also

- [CLI](CLI.md)
- [kpis](kpis.md)