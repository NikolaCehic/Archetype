# Archetype

Frontend implementation contracts for AI coding agents.

Archetype turns product briefs, screenshots, brand notes, and existing frontend context into structured contracts that Claude Code, Codex, and other coding agents can follow.

Instead of asking an agent to guess routes, screens, states, design tokens, data contracts, and acceptance criteria, generate an Archetype contract first.

## Quickstart

Install Archetype into Codex and Claude Code:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target all --json
```

Then start a fresh agent session and use Archetype as one natural-language workflow:

```txt
Codex: $archetype "I want to build a premium B2B analytics app for marketing teams."
Claude Code: /archetype "I want to build a premium B2B analytics app for marketing teams."
```

Archetype should then ask any needed clarification questions, invite optional materials such as designs, screenshots, wireframes, `SPEC.md`, or `PRD.md`, generate the spec and agent contract, drive tests-first implementation, verify the target, and patch or revise without making you learn internal commands.

CLI fallback and diagnostics:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype doctor --json
npx --yes --package github:NikolaCehic/Archetype archetype init --template saas-dashboard --out archetype.intake.json --force --json
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.intake.json --out archetype-output --json
```

See `docs/quickstart.md`, `docs/agent-lifecycle.md`, and `docs/release-readiness.md`.

## What It Does

Archetype compiles product intent into a frontend implementation package:

- product model
- route map
- screen inventory
- screen states
- design-system tokens
- component contracts
- data, action, and form contracts
- acceptance criteria
- test-first contracts
- Playwright-backed verification contract and evidence
- revision and repair task queue
- verification plan
- readiness report

## Core Flow

```txt
Product brief / screenshots / brand notes / repo context
        ↓
Archetype clarifies context and optionally ingests files
        ↓
archetype-output contract package
        ↓
Claude Code / Codex writes tests first and implements from the contract
        ↓
Archetype verifies the implementation against the contract
```

## CLI

Install paths are in `docs/install.md`.

Install the agent-host plugin surfaces:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target all --json
```

Check package, plugin, MCP, and lifecycle readiness:

```bash
npx . doctor --json
```

Create a starter intake:

```bash
npx . init --template saas-dashboard --out archetype.intake.json --json
```

Generate a contract package:

```bash
npx . generate --input examples/saas-dashboard-intake.json --out archetype-output --json
```

Validate the package:

```bash
npx . validate --out archetype-output --json
```

Summarize compact agent context:

```bash
npx . summarize --out archetype-output --json
```

Simulate implementation readiness:

```bash
npx . simulate --out archetype-output --json
```

Write a deterministic target frontend scaffold:

```bash
npx . write-target --out archetype-output --target tmp/generated-frontend --force --json
```

Verify a target frontend:

```bash
npx . verify-target --out archetype-output --target tmp/generated-frontend --json
```

Plan repair tasks from the latest verification evidence:

```bash
npx . repair --out archetype-output --target tmp/generated-frontend --json
```

## MCP

Start the local MCP server:

```bash
npm run build
npm run mcp
```

The server exposes deterministic tools for agent hosts:

- `archetype_release_doctor`
- `archetype_create_intake`
- `archetype_generate_package`
- `archetype_validate_package`
- `archetype_summarize_package`
- `archetype_read_artifact`
- `archetype_verify_target`
- `archetype_plan_repair`

See `docs/use-with-mcp.md` and `mcp.example.json`.

Installation details are in `docs/install.md`.

## What Archetype Generates

`archetype-output/` includes:

- `implementation-contract.md` - the main frontend build contract
- `spec/archetype-spec.md` - canonical human-readable source of truth
- `spec/archetype-spec.json` - canonical machine-readable source of truth
- `test-first/` - spec-derived smoke, E2E, UI, integration, and unit test contracts
- `verification/playwright-verification-contract.json` - browser verification obligations
- `verification/playwright-verification-plan.md` - human-readable browser verification plan
- `verification/playwright-verification.spec.ts` - generated Playwright browser checks
- `verification/playwright-evidence.json` - pending or completed Playwright evidence
- `10-revision/repair-task-queue.json` - concrete fix or revise tasks from verification evidence
- `10-revision/repair-plan.md` - human-readable repair plan
- `lifecycle/` - state machine, context completion, and clarification questions
- `AGENTS.md` - instructions for Codex and agentic coding tools
- `CLAUDE.md` - instructions for Claude Code
- `manifest.json` - machine-readable artifact map
- `readiness-report.md` - blockers, warnings, assumptions, readiness score
- `verification-plan.md` - checks required before completion
- `product/product-model.json` - product summary and core entities
- `experience/route-map.json` - app routes and navigation structure
- `screens/screen-inventory.json` - required screens and states
- `design-system/tokens.json` - design-system constraints
- `design-system/component-contracts.json` - reusable component contracts
- `frontend-agent-contract/` - implementation rules and acceptance criteria
- `validation/` - package validation and simulation reports

## Use With Claude Code

Install:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target claude --json
```

Then use:

```txt
/archetype "I want to build a premium B2B analytics app for marketing teams."
```

Installed Claude Code plugin surface:

- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/.claude-plugin/plugin.json`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/commands/archetype.md`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/skills/`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/agents/`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/.mcp.json`
- `~/.claude/skills/archetype/SKILL.md`

Install notes: `docs/install-claude-code-plugin.md`.

The Claude Code installer writes both the plugin surface and `~/.claude/skills/archetype/`, then installs/enables `archetype@archetype-local` when the `claude` CLI is available.

## Use With Codex

Install:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target codex --json
```

Then use:

```txt
$archetype "I want to build a premium B2B analytics app for marketing teams."
```

Installed Codex plugin surface:

- `~/.codex/skills/archetype/SKILL.md`
- `~/.codex/skills/archetype-blueprint/SKILL.md`
- `~/.codex/skills/archetype-implement/SKILL.md`
- `~/.codex/skills/archetype-verify/SKILL.md`
- `~/.codex/skills/archetype-revise/SKILL.md`
- `~/.codex/plugins/archetype/.codex-plugin/plugin.json`
- `~/plugins/archetype/.codex-plugin/plugin.json`
- `~/plugins/archetype/skills/`
- `~/plugins/archetype/.mcp.json`
- `~/.agents/plugins/marketplace.json`

Install notes: `docs/install-codex-plugin.md`.

## Demo

Run the reproducible demo:

```bash
npm run demo:run
```

Narration and expected artifacts are in `docs/demo-script.md`.

## Examples

- `examples/saas-dashboard-intake.json`
- `examples/fintech-intake.json`
- `examples/marketplace-admin-intake.json`

## Development

```bash
npm run build
npm run doctor
npm run smoke
npm run cli:contract
npm run mcp:contract
npm run plugin:claude:contract
npm run plugin:codex:contract
npm run distribution:contract
npm run release:contract
npm run plugin-install:contract
npm run repo:audit
npm run lifecycle:contract
npm run spec:contract
npm run test-first:contract
npm run playwright:contract
npm run install:contract
npm run check
```

Release notes live in `RELEASE_NOTES.md`.
