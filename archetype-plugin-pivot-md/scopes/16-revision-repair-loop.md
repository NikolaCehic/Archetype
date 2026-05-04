# Scope 16 — Revision Repair Loop

## Purpose

Close the harness loop after Playwright verification.

When target verification fails, Archetype must produce concrete implementation patch or contract revision tasks. Claude Code and Codex should not have to infer what broke from raw logs.

## Retained Scope

- Generate `10-revision/verification-repair-contract.json`.
- Generate `10-revision/repair-task-queue.json`.
- Generate `10-revision/repair-plan.md`.
- Generate `10-revision/drift-report.json`.
- Generate `10-revision/drift-report.md`.
- Update repair artifacts when `verify-target` runs.
- Expose repair planning through CLI command `archetype repair`.
- Expose repair planning through MCP tool `archetype_plan_repair`.
- Classify command failures and Playwright failures into actionable tasks.
- Trace every repair task back to spec, test-first, Playwright, target execution, and evidence artifacts.

## Removed Scope

- Do not add hosted project history.
- Do not add cloud repair orchestration.
- Do not auto-rewrite user source code from inside the compiler.
- Do not revise the spec to hide implementation drift.
- Do not add account, billing, storage, or dashboard surfaces.

## Failure Policy

```txt
Patch implementation first.
Revise the contract only when user-approved source evidence proves the canonical spec is wrong.
Keep failing tests and Playwright evidence until the same checks pass.
```

## Required Generated Artifacts

```txt
archetype-output/10-revision/verification-repair-contract.json
archetype-output/10-revision/repair-task-queue.json
archetype-output/10-revision/repair-plan.md
archetype-output/10-revision/drift-report.json
archetype-output/10-revision/drift-report.md
```

## Pass Condition

```txt
verify-target writes a passing repair queue when verification passes, and writes concrete blocker repair tasks when verification fails.
```

## Codex Instruction

Implement this as local deterministic artifacts, CLI/MCP wrappers, validation gates, and plugin guidance. Keep the product an agent harness for Claude Code and Codex.
