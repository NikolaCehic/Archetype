# Scope 10 — Roadmap And Acceptance Criteria

## Purpose

Define the build sequence and pass/fail gates for the plugin pivot.

This is the execution scoreboard.

## Phase 1 — Product Cleanup

Tasks:

```txt
[ ] Add open-source license.
[ ] Remove private package blocker if publishing.
[ ] Add package exports.
[ ] Add CLI bin entry.
[ ] Add clean README quickstart.
[ ] Add docs/use-with-claude-code.md.
[ ] Add docs/use-with-codex.md.
[ ] Add examples for at least one product category.
```

Pass condition:

```txt
A stranger can run one command and get an Archetype package.
```

## Phase 2 — Stabilize CLI

Tasks:

```txt
[ ] Implement or stabilize archetype init.
[ ] Implement or stabilize archetype generate.
[ ] Implement or stabilize archetype validate.
[ ] Implement or stabilize archetype summarize.
[ ] Implement or stabilize archetype verify-target.
[ ] Add --json mode to relevant commands.
```

Pass condition:

```txt
The CLI is deterministic enough for an agent to call and parse.
```

## Phase 3 — Generate Agent-Readable Output

Tasks:

```txt
[ ] Generate top-level README.md.
[ ] Generate top-level AGENTS.md.
[ ] Generate top-level CLAUDE.md.
[ ] Generate top-level implementation-contract.md.
[ ] Generate top-level verification-plan.md.
[ ] Generate manifest.json with stable artifact IDs.
```

Pass condition:

```txt
Claude Code or Codex can use the generated output without plugin installation.
```

## Phase 4 — MCP Server

Tasks:

```txt
[ ] Create MCP package.
[ ] Add archetype_generate_package.
[ ] Add archetype_validate_package.
[ ] Add archetype_summarize_package.
[ ] Add archetype_read_artifact.
[ ] Add archetype_verify_target.
[ ] Add local startup command.
```

Pass condition:

```txt
An agent host can call Archetype tools without manual shell commands.
```

## Phase 5 — Claude Code Plugin

Tasks:

```txt
[ ] Add Claude plugin manifest.
[ ] Add natural-language archetype front door.
[ ] Add blueprint skill.
[ ] Add implement skill.
[ ] Add verify skill.
[ ] Add revise skill.
[ ] Add product architect subagent.
[ ] Add frontend contract reviewer subagent.
[ ] Add MCP config.
```

Pass condition:

```txt
Claude Code can generate, consume, and verify Archetype contracts through plugin workflows.
```

## Phase 6 — Codex Plugin

Tasks:

```txt
[ ] Add Codex plugin manifest.
[ ] Add natural-language archetype front door.
[ ] Add archetype-blueprint skill.
[ ] Add archetype-implement skill.
[ ] Add archetype-verify skill.
[ ] Add archetype-revise skill.
[ ] Add MCP config.
[ ] Add CLI fallback instructions.
```

Pass condition:

```txt
Codex can use Archetype workflows through skills and generated AGENTS.md.
```

## Phase 7 — Distribution

Tasks:

```txt
[ ] Publish CLI package or document local install.
[ ] Publish MCP package or document local install.
[ ] Document Claude plugin installation.
[ ] Document Codex plugin installation.
[ ] Add demo video/script.
[ ] Add release notes.
```

Pass condition:

```txt
Users can install/use Archetype without cloning and reverse-engineering the repo.
```

## Phase 8 — Lifecycle Orchestrator

Tasks:

```txt
[ ] Add lifecycle state machine.
[ ] Define clarify as context completion.
[ ] Ask for optional materials after the initial idea.
[ ] Generate lifecycle artifacts into archetype-output.
[ ] Update agent instructions to read lifecycle context before implementation.
[ ] Add lifecycle contract tests.
```

Pass condition:

```txt
/archetype "project idea" implies the full lifecycle without extra user prompt choreography.
```

## Phase 9 — Canonical Spec Artifacts

Tasks:

```txt
[ ] Generate spec/archetype-spec.md.
[ ] Generate spec/archetype-spec.json.
[ ] Mark the canonical spec as source of truth.
[ ] Include lifecycle, product, experience, design-system, frontend contract, verification, and traceability.
[ ] Validate route/screen count consistency against canonical artifacts.
[ ] Update agent instructions to read the spec before implementation.
```

Pass condition:

```txt
Archetype can truthfully claim spec-driven development because every generated package contains a canonical source-of-truth spec.
```

## Phase 10 — Test-First Contracts

Tasks:

```txt
[ ] Generate test-first/test-first-contract.json.
[ ] Generate test-first/test-first-plan.md.
[ ] Generate Playwright and Vitest contract templates.
[ ] Derive route, flow, screen-state, integration, unit, and accessibility test obligations from the canonical spec.
[ ] Update agent instructions to create tests before implementation.
[ ] Validate route/screen consistency and required suite coverage.
```

Pass condition:

```txt
Archetype can truthfully claim test-driven agent implementation because every generated package declares the tests that must exist before product UI code.
```

## Phase 11 — Playwright-Backed Verification

Tasks:

```txt
[ ] Generate verification/playwright-verification-contract.json.
[ ] Generate verification/playwright-verification-plan.md.
[ ] Generate verification/playwright.config.ts.
[ ] Generate verification/playwright-verification.spec.ts.
[ ] Generate pending verification/playwright-evidence.json and markdown.
[ ] Materialize target Playwright tests through write-target.
[ ] Run Playwright from verify-target and write pass/fail evidence.
[ ] Validate route, state, flow, responsive, accessibility, visual-smoke, and evidence coverage.
```

Pass condition:

```txt
Archetype can prove browser-observable contract adherence with Playwright evidence, not only generated test intentions.
```

## Phase 12 — Revision Repair Loop

Tasks:

```txt
[ ] Generate 10-revision/verification-repair-contract.json.
[ ] Generate 10-revision/repair-task-queue.json.
[ ] Generate 10-revision/repair-plan.md.
[ ] Generate 10-revision/drift-report.json.
[ ] Generate 10-revision/drift-report.md.
[ ] Make verify-target update repair artifacts from command and Playwright evidence.
[ ] Add CLI repair command.
[ ] Add MCP archetype_plan_repair tool.
[ ] Validate repair traceability and task coverage.
```

Pass condition:

```txt
Verification failures produce concrete fix/revise tasks, and passing verification clears the repair queue.
```

## Final Acceptance Criteria

```txt
[ ] `npx @nikolacehic/archetype generate ...` works.
[ ] Claude Code plugin loads locally.
[ ] Claude blueprint skill works.
[ ] Claude implement skill works.
[ ] Claude verify skill works.
[ ] Codex blueprint skill works.
[ ] Codex implement skill works.
[ ] Codex verify skill works.
[ ] Natural-language `@Archetype @file...` flow works without user command choreography.
[ ] Natural-language `/archetype "project idea"` flow asks clarifying questions and optional material prompts by default.
[ ] Generated output includes lifecycle state machine and context completion artifacts.
[ ] Generated output includes canonical source-of-truth spec markdown and JSON.
[ ] Generated output includes spec-derived test-first contracts for smoke, E2E, UI, integration, and unit tests.
[ ] Generated output includes Playwright verification contracts, config, browser test spec, and evidence artifacts.
[ ] verify-target runs install, typecheck, production build, Playwright browser checks, and writes evidence.
[ ] Generated output includes repair contract, repair task queue, repair plan, and drift report.
[ ] Verification failures produce repair tasks before agents revise the spec.
[ ] MCP server exposes generate/validate/read/verify/repair tools.
[ ] Generated output includes AGENTS.md.
[ ] Generated output includes CLAUDE.md.
[ ] Demo app can be generated, implemented, and verified.
[ ] README shows install/use path in under 10 lines.
[ ] No workbench interaction required for first value.
```

## Codex Instruction

When implementing this roadmap, complete one phase at a time. Do not start plugin work until CLI and output contract are stable enough to call.
