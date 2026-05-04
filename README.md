# Archetype

Frontend implementation contracts for AI coding agents.

Archetype turns product briefs, screenshots, brand notes, and existing frontend context into structured contracts that Claude Code, Codex, and other coding agents can follow.

Instead of asking an agent to guess routes, screens, states, design tokens, data contracts, and acceptance criteria, generate an Archetype contract first.

## Quickstart

```bash
npm install
npm run build
npx . generate --input examples/saas-dashboard-intake.json --out archetype-output --json
```

Then ask your coding agent:

```txt
Use ./archetype-output to implement the frontend. Follow AGENTS.md or CLAUDE.md and run verification before declaring completion.
```

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
- verification plan
- readiness report

## Core Flow

```txt
Product brief / screenshots / brand notes / repo context
        ↓
Archetype CLI or plugin
        ↓
archetype-output contract package
        ↓
Claude Code / Codex implements from the contract
        ↓
Archetype verifies the implementation against the contract
```

## CLI

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

## What Archetype Generates

`archetype-output/` includes:

- `implementation-contract.md` - the main frontend build contract
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

Generate an Archetype package:

```bash
npx . generate --input archetype.intake.json --out archetype-output --json
```

Then in Claude Code:

```txt
Use ./archetype-output to implement the frontend. Follow CLAUDE.md, implementation-contract.md, and verification-plan.md.
```

Plugin support is tracked in `archetype-plugin-pivot-md/scopes/07-claude-code-plugin.md`.

## Use With Codex

Generate an Archetype package:

```bash
npx . generate --input archetype.intake.json --out archetype-output --json
```

Then ask Codex:

```txt
Use ./archetype-output to implement the frontend. Follow AGENTS.md, implementation-contract.md, and verification-plan.md.
```

Plugin support is tracked in `archetype-plugin-pivot-md/scopes/08-codex-plugin.md`.

## Examples

- `examples/saas-dashboard-intake.json`
- `examples/fintech-intake.json`
- `examples/marketplace-admin-intake.json`

## Development

```bash
npm run build
npm run smoke
npm run cli:contract
npm run check
```

The pivot reference lives in `archetype-plugin-pivot-md/`. That folder is the source of truth for the agent-harness direction.
