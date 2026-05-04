# Install The Codex Plugin

Install Archetype into Codex with one command:

```bash
npx -y -p @nikolacehic/archetype archetype install --target codex --json
```

The installer writes:

- `~/plugins/archetype/.codex-plugin/plugin.json`
- `~/plugins/archetype/.mcp.json`
- `~/plugins/archetype/skills/archetype/SKILL.md`
- `~/plugins/archetype/skills/blueprint/SKILL.md`
- `~/plugins/archetype/skills/implement/SKILL.md`
- `~/plugins/archetype/skills/verify/SKILL.md`
- `~/plugins/archetype/skills/revise/SKILL.md`
- `~/.agents/plugins/marketplace.json`

For local source testing:

```bash
npm run build
npx . install --target codex --json
npx . doctor --json
```

## Use

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
npm run plugin-install:contract
npm run plugin:codex:contract
npm run release:contract
```
