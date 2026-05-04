# Scope 09 — Demo And Examples

## Purpose

Create one killer demo that proves Archetype makes coding agents guess less.

The demo should be short, reproducible, and focused on the core product loop.

## Demo Thesis

```txt
Brief → Archetype contract → coding agent implementation → verification
```

The demo should not try to prove Archetype can build every type of app.

## Primary Demo

Use a B2B SaaS analytics dashboard.

Input brief:

```txt
I am building a B2B SaaS analytics dashboard for marketing teams. It needs onboarding, workspace selection, campaign overview, report builder, billing, and settings. The style should be dense, premium, dark, and enterprise-grade.
```

Expected generated contract:

```txt
archetype-output/
  implementation-contract.md
  AGENTS.md
  CLAUDE.md
  manifest.json
  readiness-report.md
  verification-plan.md
  experience/route-map.json
  screens/screen-inventory.json
  design-system/tokens.json
  frontend-agent-contract/frontend-agent-instructions.md
```

## Demo Commands

### Generate

```bash
npx --yes --package github:NikolaCehic/Archetype archetype generate --input examples/saas-dashboard-intake.json --out archetype-output
```

### Validate

```bash
npx --yes --package github:NikolaCehic/Archetype archetype validate --out archetype-output
```

### Implement With Codex

```txt
Use the Archetype package in ./archetype-output to implement the frontend. Follow AGENTS.md and the implementation contract. Do not invent routes, states, or product copy outside the contract.
```

### Implement With Claude Code

```txt
Use the Archetype package in ./archetype-output to implement the frontend. Follow CLAUDE.md and the implementation contract. Run verification before declaring completion.
```

### Verify

```bash
npx --yes --package github:NikolaCehic/Archetype archetype verify-target --out archetype-output --target .
```

## Secondary Examples

Create these later:

```txt
examples/fintech-intake.json
examples/marketplace-admin-intake.json
```

## Demo Success Criteria

The demo must show:

- generated route map
- generated screen inventory
- generated design tokens
- generated screen state requirements
- generated frontend-agent instructions
- generated verification plan
- implemented frontend scaffold
- verification report identifying pass/warning/fail

## What Not To Demo

Do not lead with:

- workbench UI
- giant artifact list
- internal compiler complexity
- multi-agent orchestration
- marketplace install polish
- every possible product category

Lead with:

```txt
The coding agent no longer has to guess the frontend architecture.
```

## Acceptance Criteria

```txt
[ ] SaaS dashboard intake exists.
[ ] Demo generate command works.
[ ] Demo validate command works.
[ ] Demo implementation prompt works in Claude/Codex.
[ ] Demo verify command works.
[ ] Demo can be explained in under 2 minutes.
```

## Codex Instruction

When implementing this scope, create the example and demo script only. Do not broaden product scope or add new features just to make the demo flashier.
