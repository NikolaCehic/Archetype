# Scope 11 — README Rewrite

## Purpose

Rewrite the README around the plugin pivot and the contract-generation value proposition.

The current README should not lead with internal complexity. It should lead with value, quickstart, and agent usage.

## README Structure

```md
# Archetype

Frontend implementation contracts for AI coding agents.

## What it does

Archetype turns product briefs, screenshots, brand notes, and existing frontend context into implementation-ready contracts for Claude Code, Codex, and other coding agents.

## Why

Coding agents are good at writing code but bad at guessing product architecture. Archetype gives them the missing contract: routes, screens, states, components, tokens, data contracts, acceptance criteria, and verification rules.

## Quickstart

npx --yes --package github:NikolaCehic/Archetype archetype generate --input examples/saas-dashboard-intake.json --out archetype-output

## Use with Claude Code

Use the generated CLAUDE.md and implementation contract, or install the Claude Code plugin when available.

## Use with Codex

Use the generated AGENTS.md and implementation contract, or install the Codex plugin when available.

## Output

- implementation contract
- route map
- screen specs
- design-system tokens
- frontend agent contract
- verification plan
- readiness report

## Packages

- @nikolacehic/archetype
- @nikolacehic/archetype-mcp

## Examples

- SaaS analytics dashboard
- Fintech onboarding app
- Marketplace admin console
```

## Above-The-Fold Copy

Use this:

```md
# Archetype

Frontend implementation contracts for AI coding agents.

Archetype turns product briefs, screenshots, brand notes, and existing frontend context into structured contracts that Claude Code, Codex, and other coding agents can follow.

Instead of asking an agent to guess routes, screens, states, design tokens, data contracts, and acceptance criteria, generate an Archetype contract first.
```

## Quickstart Copy

```md
## Quickstart

```bash
npx --yes --package github:NikolaCehic/Archetype archetype generate \
  --input examples/saas-dashboard-intake.json \
  --out archetype-output
```

Then ask your coding agent:

```txt
Use ./archetype-output to implement the frontend. Follow AGENTS.md or CLAUDE.md and run verification before declaring completion.
```
```

## Use With Claude Code Copy

```md
## Use With Claude Code

Generate an Archetype package:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.intake.json --out archetype-output
```

Then in Claude Code:

```txt
Use ./archetype-output to implement the frontend. Follow CLAUDE.md, implementation-contract.md, and verification-plan.md.
```

Plugin support is planned under `plugins/claude-code/`.
```

## Use With Codex Copy

```md
## Use With Codex

Generate an Archetype package:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.intake.json --out archetype-output
```

Then ask Codex:

```txt
Use ./archetype-output to implement the frontend. Follow AGENTS.md, implementation-contract.md, and verification-plan.md.
```

Plugin support is planned under `plugins/codex/`.
```

## Output Section Copy

```md
## What Archetype Generates

`archetype-output/` includes:

- `implementation-contract.md` — the main frontend build contract
- `AGENTS.md` — instructions for Codex and agentic coding tools
- `CLAUDE.md` — instructions for Claude Code
- `manifest.json` — machine-readable artifact map
- `readiness-report.md` — blockers, warnings, assumptions, readiness score
- `verification-plan.md` — checks required before completion
- `experience/route-map.json` — app routes and navigation structure
- `screens/screen-inventory.json` — required screens and states
- `design-system/tokens.json` — design-system constraints
- `frontend-agent-contract/` — implementation rules and acceptance criteria
```

## Copy To Avoid

Do not lead with:

```txt
100-scenario E2E catalog
workspace package tagging
bulk package actions
saved package comparison
workspace health export
```

Those can exist lower in the docs, but they should not be the top-level product message.

## Acceptance Criteria

```txt
[ ] README has sharp category positioning.
[ ] README quickstart is under 10 lines.
[ ] README explains use with Claude Code.
[ ] README explains use with Codex.
[ ] README explains output package.
[ ] README does not overclaim autonomous-agent behavior.
[ ] README does not require workbench for first value.
```

## Codex Instruction

When implementing this scope, rewrite README for adoption. Do not dump every internal feature into the top half of the file.
