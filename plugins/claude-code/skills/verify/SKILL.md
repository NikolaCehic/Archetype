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
2. Prefer MCP tool `archetype_summarize_package` for compact route, screen, state, readiness, blocker, and warning context.
3. Prefer MCP tool `archetype_verify_target` with the target frontend directory.
4. Pass `skipInstall: false` only when the user explicitly allows dependency installation in the target frontend.
5. If MCP is unavailable, use the CLI fallback:

```bash
npx -y -p @nikolacehic/archetype archetype validate --out archetype-output --json
npx -y -p @nikolacehic/archetype archetype summarize --out archetype-output --json
npx -y -p @nikolacehic/archetype archetype verify-target --out archetype-output --target . --skip-install --json
```

## Review Focus

- `verification/playwright-verification-contract.json`
- `verification/playwright-evidence.json`
- `verification/playwright-evidence.md`
- route coverage
- screen coverage
- required loading, empty, error, success, stale, offline, and permission states
- flow, responsive, and visual-smoke coverage
- design tokens and component contracts
- data, action, and form contracts
- accessibility expectations
- acceptance criteria

Return pass, warning, or fail with concrete fixes.
