# bosun init

Initialize a new Bosun project with default configuration.

## Usage

```bash
bosun init <project-name>
```

## Description

Creates a new Bosun project with:
- `.bosun/config.json` - Project configuration file
- `.bosun/docs/` - CLI documentation directory
- `AGENTS.md` - OpenCode/Claude Code rules
- `.claude/CLAUDE.md` - Project-level agent config

## Options

| Option | Description |
|--------|-------------|
| `-o, --okr <file>` | Load OKR definitions from JSON file |

## Example

```bash
bosun init my-app
# Creates:
#   .bosun/config.json
#   .bosun/docs/CLI.md
#   .bosun/docs/*.md
#   AGENTS.md
#   .claude/CLAUDE.md
```

## Next Steps

1. Edit `.bosun/config.json` to add OKRs and key results
2. Run `bosun status` to see project status
3. Use other commands during development

## See Also

- [CLI](CLI.md)
- [status](status.md)