# Install The Codex Plugin

Install Archetype into Codex with one command:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target codex --json
```

The installer writes:

- `~/.codex/skills/archetype/SKILL.md`
- `~/.codex/skills/archetype-blueprint/SKILL.md`
- `~/.codex/skills/archetype-implement/SKILL.md`
- `~/.codex/skills/archetype-verify/SKILL.md`
- `~/.codex/skills/archetype-revise/SKILL.md`
- `~/.codex/plugins/archetype/.codex-plugin/plugin.json`
- `~/plugins/archetype/.codex-plugin/plugin.json`
- `~/plugins/archetype/.mcp.json`
- `~/plugins/archetype/skills/archetype/SKILL.md`
- `~/plugins/archetype/skills/blueprint/SKILL.md`
- `~/plugins/archetype/skills/implement/SKILL.md`
- `~/plugins/archetype/skills/verify/SKILL.md`
- `~/plugins/archetype/skills/revise/SKILL.md`
- `~/plugins/archetype/agents/`
- `~/.agents/plugins/marketplace.json`

The `agents/` folder includes specialist role files for product, experience, frontend architecture, design-system, practice enforcement, strict typing, pixel-perfect UI, accessibility, test-first implementation, contract verification, repair planning, and QA. Each role states authority, inputs, outputs, blockers, handoff rules, and the rule that no agent can approve its own work.

For local source testing:

```bash
npm run build
npx . install --target codex --json
npx . doctor --json
```

## Use

The natural front door is:

```txt
$archetype "I want to build a premium B2B analytics app for marketing teams."
```

Codex `@` mentions are for attaching files and folders such as `@SPEC.md` or `@screenshots/login.png`. Archetype itself is loaded as the `$archetype` skill.

Codex should ask needed clarification questions, invite optional materials, generate the contract, write tests first, implement from the contract, and verify without asking the user to run CLI commands.

Lifecycle details live in `docs/agent-lifecycle.md`.

The plugin `.mcp.json` launches:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype-mcp
```

Codex can still use generated `AGENTS.md` without the plugin.

## Validate

```bash
npm run plugin-install:contract
npm run plugin:codex:contract
npm run release:contract
```
