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
- `plugins/codex/skills/archetype/SKILL.md`
- `plugins/codex/skills/archetype-blueprint/SKILL.md`
- `plugins/codex/skills/archetype-implement/SKILL.md`
- `plugins/codex/skills/archetype-verify/SKILL.md`
- `plugins/codex/skills/archetype-revise/SKILL.md`

Before loading the plugin, verify the release surface:

```bash
npm run build
npx . doctor --json
```

## MCP

The natural front door is:

```txt
@Archetype "I want to build a premium B2B analytics app for marketing teams."
```

Codex should ask needed clarification questions, invite optional materials, generate the contract, write tests first, implement from the contract, and verify without asking the user to run CLI commands.

Lifecycle details live in `docs/agent-lifecycle.md`.

The plugin `.mcp.json` launches:

```bash
npx -y -p @nikolacehic/archetype archetype-mcp
```

Codex can still use generated `AGENTS.md` without the plugin.

## Validate

```bash
npm run plugin:codex:contract
npm run release:contract
```
