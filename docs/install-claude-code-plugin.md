# Install The Claude Code Plugin

The Claude Code plugin wrapper lives at `plugins/claude-code/`.

## Local Plugin Path

Point Claude Code at:

```txt
plugins/claude-code/
```

Required files:

- `plugins/claude-code/.claude-plugin/plugin.json`
- `plugins/claude-code/.mcp.json`
- `plugins/claude-code/skills/archetype/SKILL.md`
- `plugins/claude-code/skills/blueprint/SKILL.md`
- `plugins/claude-code/skills/implement/SKILL.md`
- `plugins/claude-code/skills/verify/SKILL.md`
- `plugins/claude-code/skills/revise/SKILL.md`
- `plugins/claude-code/agents/product-architect.md`
- `plugins/claude-code/agents/frontend-contract-reviewer.md`

## MCP

The natural front door is:

```txt
/archetype @docs/product-brief.md @screens/dashboard.png Build the frontend. Ask me what is missing, then implement and verify.
```

Claude Code should read the imported `@` files, ask only missing product questions, generate the contract, implement from it, and verify without asking the user to run CLI commands.

The plugin `.mcp.json` launches:

```bash
npx -y -p @nikolacehic/archetype archetype-mcp
```

For local source testing, build the repo first:

```bash
npm install
npm run build
npm run mcp
```

## Validate

```bash
npm run plugin:claude:contract
```
