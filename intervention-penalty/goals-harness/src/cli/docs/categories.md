# bosun categories

List available adversarial probe categories.

## Usage

```bash
bosun categories
```

## Description

Shows all 5 probe categories used in adversarial testing:

| Category | Probes | Description |
|----------|--------|-------------|
| `input_validation` | 3 | Empty inputs, type checking, boundary values |
| `security` | 3 | Injection prevention, credentials, unsafe ops |
| `error_handling` | 3 | Exception handling, logging, fallbacks |
| `edge_cases` | 3 | Empty states, duplicates, concurrency |
| `performance` | 3 | Resource cleanup, data structures, loops |

## Example

```bash
$ bosun categories

## Probe Categories

  - input_validation
  - security
  - error_handling
  - edge_cases
  - performance
```

## Total Probes

15 probes across 5 categories.

## See Also

- [CLI](CLI.md)
- [probe](probe.md)