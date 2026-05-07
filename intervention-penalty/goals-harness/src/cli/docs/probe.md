# bosun probe

Run adversarial security probes on artifacts.

## Usage

```bash
bosun probe <file...> [options]
```

## Options

| Option | Description |
|--------|-------------|
| `-c, --category <cat>` | Probe category to run |

## Categories

| Category | Description |
|----------|-------------|
| `input_validation` | Empty inputs, type checking, boundary values |
| `security` | Injection prevention, credential exposure, unsafe ops |
| `error_handling` | Try-catch, logging, fallback behavior |
| `edge_cases` | Empty states, duplicates, concurrency |
| `performance` | Resource cleanup, data structures, loops |

## Example

```bash
$ bosun probe src/**/*.ts

## Adversarial Probe Results

### INPUT VALIDATION
  ✓ Empty input handling: Empty input checks present
  ✗ Boundary value handling: No boundary value handling found

### SECURITY
  ✓ Injection prevention: No dangerous patterns detected
  ✓ Credential exposure: No hardcoded credentials detected

### ERROR HANDLING
  ✓ Exception handling: Try-catch blocks present

Total: 12/15 passed
```

## Run Specific Category

```bash
bosun probe src/**/*.ts --category security
```

## See Also

- [CLI](CLI.md)
- [categories](categories.md)
- [check](check.md)