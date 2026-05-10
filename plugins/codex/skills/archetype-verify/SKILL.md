---
name: archetype-verify
description: Use when Codex should verify a frontend implementation against an Archetype contract package.
---

# Archetype Verify

Verify the target frontend against `archetype-output`.

## Workflow

1. Prefer MCP tool `archetype_validate_package`.
2. Prefer MCP tool `archetype_summarize_package`.
3. Read `agent-context/consumer-plane.json`, `review-console/session.json`, `progressive/lazy-contract-index.json`, `agent-context/context-summary.json`, `agent-context/phase-bundles/verification.json`, `agent-context/phase-bundles/qa.json`, and `agent-context/phase-bundles/repair.json` before opening larger verification artifacts.
4. Prefer MCP tool `archetype_verify_target`.
5. If verification fails or warns, call MCP tool `archetype_plan_repair` and read `10-revision/repair-task-queue.json`.
6. Pass `skipInstall: false` only with explicit user permission to install dependencies in the target frontend.
7. If MCP is unavailable, use CLI fallback:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype validate --out archetype-output --json
npx --yes --package github:NikolaCehic/Archetype archetype summarize --out archetype-output --json
npx --yes --package github:NikolaCehic/Archetype archetype verify-target --out archetype-output --target . --skip-install --json
npx --yes --package github:NikolaCehic/Archetype archetype repair --out archetype-output --target . --json
```

## Review

Read `test-first/test-quality-standard.json`, `governance/forbidden-behaviors.json`, `governance/convergence-standard.json`, `04-design-system/design-quality-gate.json`, `04-design-system/shadcn-integration.json`, and `verification/playwright-verification-contract.json` before running verification. After verification, inspect `verification/playwright-evidence.json`, `verification/playwright-evidence.md`, and `10-revision/repair-task-queue.json`. Marker-only tests fail `verify-target`.

Check routes, screens, required states, flow coverage, responsive behavior, visual-smoke screenshots, component contracts, tokens, the design-quality gate, shadcn integration, data contracts, action contracts, form contracts, accessibility expectations, and acceptance criteria. Return pass, warning, or fail with concrete fixes. Fail any implementation that uses a generic blue-gray SaaS palette, untouched shadcn defaults, raw Tailwind visual literals, missing component states, or generic card-grid composition when the design-quality gate forbids it.
