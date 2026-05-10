---
name: archetype-verify
description: Use when verifying a frontend implementation against an Archetype contract package.
---

# Archetype Verify

Use this skill for `/archetype:verify`.

## Goal

Prove the target frontend follows the Archetype contract package.

## Workflow

1. Prefer MCP tool `archetype_validate_package` for `archetype-output`.
2. Prefer MCP tool `archetype_summarize_package` for compact route, screen, state, readiness, blocker, warning, and phase-bundle context.
3. Read `agent-context/consumer-plane.json`, `review-console/session.json`, `progressive/lazy-contract-index.json`, `agent-context/context-summary.json`, `agent-context/phase-bundles/verification.json`, `agent-context/phase-bundles/qa.json`, and `agent-context/phase-bundles/repair.json` before opening larger verification artifacts.
4. Prefer MCP tool `archetype_verify_target` with the target frontend directory.
5. If verification fails or warns, call MCP tool `archetype_plan_repair` and read `10-revision/repair-task-queue.json`.
6. Pass `skipInstall: false` only when the user explicitly allows dependency installation in the target frontend.
7. If MCP is unavailable, use the CLI fallback:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype validate --out archetype-output --json
npx --yes --package github:NikolaCehic/Archetype archetype summarize --out archetype-output --json
npx --yes --package github:NikolaCehic/Archetype archetype verify-target --out archetype-output --target . --skip-install --json
npx --yes --package github:NikolaCehic/Archetype archetype repair --out archetype-output --target . --json
```

## Review Focus

- `test-first/test-quality-standard.json`
- `governance/forbidden-behaviors.json`
- `governance/convergence-standard.json`
- `verification/playwright-verification-contract.json`
- `verification/playwright-evidence.json`
- `verification/playwright-evidence.md`
- `10-revision/repair-task-queue.json`
- `10-revision/repair-plan.md`
- route coverage
- screen coverage
- required loading, empty, error, success, stale, offline, and permission states
- flow, responsive, and visual-smoke coverage
- design tokens and component contracts
- `04-design-system/design-quality-gate.json` and `04-design-system/shadcn-integration.json`
- data, action, and form contracts
- accessibility expectations
- acceptance criteria
- marker-only tests fail `verify-target`

Return pass, warning, or fail with concrete fixes. Fail any implementation that uses a generic blue-gray SaaS palette, untouched shadcn defaults, raw Tailwind visual literals, missing component states, or generic card-grid composition when the design-quality gate forbids it.
