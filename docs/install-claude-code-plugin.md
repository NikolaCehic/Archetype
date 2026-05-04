# Install The Claude Code Plugin

Install Archetype into Claude Code with one command:

```bash
npx -y -p @nikolacehic/archetype archetype install --target claude --json
```

The installer writes a local Claude Code marketplace plus the plugin surface:

- `~/.claude/plugins/marketplaces/archetype-local/.claude-plugin/marketplace.json`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/.claude-plugin/plugin.json`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/.mcp.json`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/skills/archetype/SKILL.md`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/skills/blueprint/SKILL.md`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/skills/implement/SKILL.md`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/skills/verify/SKILL.md`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/skills/revise/SKILL.md`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/agents/product-architect.md`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/agents/frontend-contract-reviewer.md`

For local source testing:

```bash
npm run build
npx . install --target claude --json
npx . doctor --json
```

## Use

The natural front door is:

```txt
/archetype "I want to build a premium B2B analytics app for marketing teams."
```

Claude Code should ask needed clarification questions, invite optional materials, generate the contract, write tests first, implement from the contract, and verify without asking the user to run CLI commands.

Lifecycle details live in `docs/agent-lifecycle.md`.

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
npm run plugin-install:contract
npm run plugin:claude:contract
npm run release:contract
```
