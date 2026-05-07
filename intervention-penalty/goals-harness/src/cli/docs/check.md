# bosun check

Run DoD (Definition of Done) checks on artifacts.

## Usage

```bash
bosun check <file...> [options]
```

## Options

| Option | Description |
|--------|-------------|
| `-d, --dod <name>` | DoD name to use (default: "default") |

## Description

Verifies that artifacts meet the Definition of Done criteria:
- All acceptance criteria met
- No TODO/FIXME comments remaining
- Tests present
- Code compiles without errors

## Example

```bash
$ bosun check src/**/*.ts

## DoD Check: Default DoD

✓ All acceptance criteria met
✓ No TODO comments remaining
✓ Tests present
✓ Code compiles without errors

Result: ✓ PASSED
```

## Custom DoD

You can define custom DoDs via the API and reference them:

```bash
bosun check src/**/*.ts --dod custom-dod-name
```

## See Also

- [CLI](CLI.md)
- [probe](probe.md)
- [kpis](kpis.md)