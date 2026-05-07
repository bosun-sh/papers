# bosun kpis

Measure all 8 KPIs on artifacts.

## Usage

```bash
bosun kpis <file...>
```

## Description

Measures each of the 8 KPIs defined in the Bosun framework:

| KPI | Target |
|-----|--------|
| `specification_adherence` | ≥ 0.90 |
| `citation_density` | ≥ 2.0 |
| `citation_integrity` | = 1.0 |
| `cross_reference_consistency` | = 1.0 |
| `review_convergence` | ≤ 2 rounds |
| `first_draft_acceptance` | ≥ 0.50 |
| `terminology_consistency` | ≥ 0.95 |
| `cycle_time` | tracked (no threshold) |

## Example

```bash
$ bosun kpis src/**/*.ts

## KPI Measurements

✗ **specification_adherence**
   Value: 0.750
   Target: 0.9
   ✗ 0.75 < 0.9

✓ **citation_density**
   Value: 2.500
   Target: 2.0
   ✓ 2.50 ≥ 2.0

✗ **terminology_consistency**
   Value: 0.800
   Target: 0.95
   ✗ 0.80 < 0.95

Overall: ✗ Some KPIs below threshold
```

## Interpreting Results

- ✓ Passed: KPI meets or exceeds target
- ✗ Failed: KPI below target threshold

## See Also

- [CLI](CLI.md)
- [probe](probe.md)
- [check](check.md)