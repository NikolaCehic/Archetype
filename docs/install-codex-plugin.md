# Install The Codex Plugin

The Codex plugin wrapper lives at `plugins/codex/`.

## Local Plugin Path

Point Codex at:

```txt
plugins/codex/
```

Required files:

- `plugins/codex/.codex-plugin/plugin.json`
- `plugins/codex/.mcp.json`
- `plugins/codex/skills/archetype-blueprint/SKILL.md`
- `plugins/codex/skills/archetype-implement/SKILL.md`
- `plugins/codex/skills/archetype-verify/SKILL.md`
- `plugins/codex/skills/archetype-revise/SKILL.md`

## MCP

The plugin `.mcp.json` launches:

```bash
npx -y -p @nikolacehic/archetype archetype-mcp
```

Codex can still use generated `AGENTS.md` without the plugin.

## Validate

```bash
npm run plugin:codex:contract
```
