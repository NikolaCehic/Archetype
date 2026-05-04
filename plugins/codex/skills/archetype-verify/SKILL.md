---
name: archetype-verify
description: Use when Codex should verify a frontend implementation against an Archetype contract package.
---

# Archetype Verify

Verify the target frontend against `archetype-output`.

## Workflow

1. Prefer MCP tool `archetype_validate_package`.
2. Prefer MCP tool `archetype_summarize_package`.
3. Prefer MCP tool `archetype_verify_target`.
4. Pass `skipInstall: false` only with explicit user permission to install dependencies in the target frontend.
5. If MCP is unavailable, use CLI fallback:

```bash
npx -y -p @nikolacehic/archetype archetype validate --out archetype-output --json
npx -y -p @nikolacehic/archetype archetype summarize --out archetype-output --json
npx -y -p @nikolacehic/archetype archetype verify-target --out archetype-output --target . --skip-install --json
```

## Review

Read `verification/playwright-verification-contract.json` before running verification. After verification, inspect `verification/playwright-evidence.json` and `verification/playwright-evidence.md`.

Check routes, screens, required states, flow coverage, responsive behavior, visual-smoke screenshots, component contracts, tokens, data contracts, action contracts, form contracts, accessibility expectations, and acceptance criteria. Return pass, warning, or fail with concrete fixes.
