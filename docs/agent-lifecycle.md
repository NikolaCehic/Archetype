# Agent Lifecycle

Archetype is a self-contained agent harness. The user should only need a natural-language idea and optional `@` file imports.

The executable front-door primitive is:

```bash
archetype run "<idea>" --material <path> --out archetype-output --force --json
```

Agent hosts should prefer MCP tool `archetype_run_lifecycle` for `$archetype` and `/archetype`. The primitive creates or updates intake, safely ingests materials, records material hashes in `lifecycle/source-graph.json`, writes `lifecycle/run-state.json`, writes the consumer-plane next-action contract in `agent-context/consumer-plane.json`, stops on one-question clarification when context is weak, produces the draft design-system preview and approval request, and uses the same command/tool for approval continuation.

## Flow

```txt
idea
  -> clarify missing context one question at a time
  -> source-material gate: attach/import materials or explicitly proceed without them
  -> intake source evidence
  -> generate draft contract
  -> generate source-derived design directions and design-quality gate
  -> browser design-system review
  -> review candidate assumptions and risks
  -> human approval or edits
  -> generate canonical spec
  -> generate test-first contracts
  -> implement tests first
  -> implement frontend from the contract
  -> verify with Playwright evidence
  -> collect QA evidence
  -> repair implementation drift or revise the contract with approved evidence
```

## Clarify

Clarify means context completion. The agent reads the idea, screenshots, briefs, repo files, `SPEC.md`, `PRD.md`, wireframes, and other optional materials, then asks exactly one highest-impact question for the missing, conflicted, or blocked decision that prevents a deterministic contract.

After the user answers, the agent applies that answer with `archetype_answer_clarification` or `archetype answer-clarification`, updates the intake and context matrix, then repeats until the next lifecycle gate is safe.

The source-material gate is blocking. For a weak idea, the expected early sequence is: identify the primary user, ask whether the user has `SPEC.md`, SOP, PRD, screenshots, wireframes, design docs, API docs, route maps, or repo files, then wait for actual attachments/imports or an explicit "proceed without source materials" decision. The lifecycle must not draft, scaffold, write tests, or implement while that gate is unresolved.

With the lifecycle primitive, the same update can be done without separate command choreography:

```bash
archetype run --intake archetype.intake.json --out archetype-output --question-id <id> --answer "<answer>" --force --json
```

The user should not need to say:

```txt
Build this frontend. Ask me what is missing, then implement and verify.
```

That is the default lifecycle.

## Context Artifacts

Agents should begin with the compact context surface:

```txt
agent-context/consumer-plane.json
agent-context/consumer-plane.md
agent-context/context-summary.json
agent-context/context-summary.md
agent-context/phase-bundles/index.json
agent-context/phase-bundles/clarification.json
agent-context/phase-bundles/draft-review.json
agent-context/phase-bundles/contract-approval.json
agent-context/phase-bundles/test-first.json
agent-context/phase-bundles/implementation.json
agent-context/phase-bundles/verification.json
agent-context/phase-bundles/qa.json
agent-context/phase-bundles/repair.json
```

The consumer plane is the first-read artifact. It tells the host what to say to the user, which lifecycle action is legal next, which full artifacts are allowed now, and which reads are forbidden until a later phase. It is also exposed through `archetype next-action --out archetype-output --json` and MCP tool `archetype_consumer_next_action`.

The active phase bundle is the scoped read artifact for the current lifecycle phase. It lists required reads, optional reads, MCP query hints, the entry gate, the exit gate, and the policy for when a full artifact read is justified.

## Review Console

Every package includes:

```txt
review-console/index.html
review-console/session.json
review-console/approval-decisions.json
review-console/design-diff.json
review-console/run-timeline.json
```

The review console is the local decision cockpit. It shows current phase, what Archetype knows, missing decisions, the one active question, attached materials, route proposals, design preview links, approval checklist, blocked reasons, timeline, and next legal action.

Users review decisions there. Agents still use the JSON artifacts for deterministic handoff.

## Progressive Expansion

Every package includes:

```txt
progressive/generation-plan.json
progressive/lazy-contract-index.json
progressive/token-budget.json
progressive/phase-package-plan.json
```

The progressive layer defines summary-first, lazy-expand behavior. It records generated-now artifacts, deferred artifacts by phase, token budgets, and the phase package command.

Use:

```bash
archetype phase-package --out archetype-output --phase <phase> --target archetype-phase-package --force --json
```

This creates a small handoff package for the current phase and avoids making the host agent read the whole generated tree.

Every generated package includes:

```txt
lifecycle/run-state.json
lifecycle/source-graph.json
lifecycle/context-completion.json
lifecycle/clarification-turn.json
lifecycle/implementation-phases.json
lifecycle/contract-state.json
lifecycle/execution-state.json
lifecycle/lifecycle-report.md
draft/frontend-contract.draft.json
draft/design-directions.json
draft/design-quality-gate.json
draft/design-craft-rubric.md
draft/design-system-preview.html
draft/design-system-review.md
draft/assumption-ledger.md
governance/forbidden-behaviors.json
governance/convergence-standard.json
governance/frontend-practice-skills.json
draft/contract-approval-request.json
```

The Agent Data Plane augments those artifacts with replayable run records under `data-plane/runs/<run-id>/`. It records lifecycle gates, evidence summaries, contract refs, verification status, repair provenance, and generated artifact lineage without replacing the contract artifacts themselves. See `docs/agent-data-plane.md`.

The Agent Control Plane is the phase authority. Every package includes `governance/agent-control-plane.json` and `governance/agent-control-plane.md`. Agents must read the JSON before each phase transition; P0 blocked or failed gates stop the lifecycle until the named `next_action` is satisfied. The control plane is separate from the data plane: it decides permission, while the data plane records evidence and replay state. See `docs/agent-control-plane.md`.

## Agent Rule

Spec-driven development starts from the approved canonical `spec/archetype-spec.json`. Before approval, Archetype emits draft artifacts only and must not ask an implementation agent to write product UI.

Approval is bound to generated evidence, not to a mutable boolean in the intake file. The review primitive supports approve, request changes, and reject:

```bash
archetype review --draft archetype-output --input archetype.intake.json --decision approve --reviewer "Human reviewer" --out archetype-output-approved --force --json
archetype review --draft archetype-output --input archetype.intake.json --decision request_changes --reviewer "Human reviewer" --feedback "Explain the change" --out archetype-output-revised --force --json
archetype review --draft archetype-output --input archetype.intake.json --decision reject --reviewer "Human reviewer" --feedback "Wrong direction" --json
```

`review --decision approve` records the draft package id, source hash, package checksum, approval digest, hashes for required draft artifacts, and the draft contract fingerprint. `request_changes` records feedback as source evidence and regenerates a draft. `reject` records the decision and keeps implementation blocked. A raw `contractApproval` object without the approval proof remains blocked.

The draft contract fingerprint covers routes, screens, component names, design token digest, and frontend contract digest. Canonical generation must preserve that fingerprint before the control plane permits implementation.

The compiler is phase-safe. Draft packages include a `compiler_phases` manifest trace showing context, draft, and approval as constructed while canonical, test-first, verification, target, QA, and repair phases remain skipped. Those later phases are not constructed in memory or written to disk until the bound approval proof is regenerated into a canonical package.

Draft design-system review is encoded in `draft/design-directions.json`, `draft/design-quality-gate.json`, `draft/design-craft-rubric.md`, `draft/design-system-preview.html`, and `draft/design-system-review.md`. The preview is static browser-viewable HTML generated from `draft/design-system.draft.json`; it is not app code and not the source of truth. Users can ask questions or request changes, ambiguous requests return to one clarification question, and Archetype revises the draft JSON before regenerating the preview.

The design-quality gate is a hard anti-generic UI contract. It requires source-derived design directions, a selected direction, source signatures, material alignment, route/screen alignment, shadcn and Tailwind integration rules, state coverage, browser-reviewable preview, and Playwright preview evidence. Reusable preset directions, default blue-gray SaaS UI, untouched shadcn examples, generic card-grid dashboards, missing interaction states, and route/source mismatches are blockers. If human review says the draft is the wrong product, Archetype must revise and regenerate the draft instead of letting a host agent build a direct fallback app. See `docs/design-quality-gate.md`.

Test-driven implementation starts from `test-first/test-first-contract.json` only after the canonical spec package exists.

The test quality standard lives at `test-first/test-quality-standard.json`. Tests that only prove `[data-archetype-screen]` or marker presence fail `verify-target`; valid tests must prove visible behavior, deterministic states, accessible names and landmarks, route/deep-link behavior, malformed data handling, and desktop/tablet/mobile visual evidence.

Complete packages preserve approval and evidence traceability through `lifecycle/approval-request.md`, `lifecycle/approval-decision.json`, `reviews/specialist-review-summary.md`, `test-results/initial-red-test-run.md`, and `lifecycle/final-readiness-report.md`.

Token-bounded context is part of the lifecycle. `archetype_summarize_package` defaults to compact MCP output, `archetype summarize --compact` returns only the consumer plane, summary, and phase index, and `archetype_read_artifact` returns bounded content with `nextRead` continuation instructions for large artifacts.

Forbidden lifecycle behavior is encoded in `governance/forbidden-behaviors.json`. The package must reject weak-context code generation, inferred routes treated as accepted routes, warning-based readiness claims, bulk clarification, hidden assumptions, default Vite READMEs, mock-only production claims, generic success-state workflows, marker-only tests, unapproved contract mutation, and QA without Playwright evidence.

Generated output safety is part of the lifecycle. `archetype-output/` and generated target frontends carry marker files so commands can distinguish Archetype-owned output from user projects. Recursive overwrite is refused for unmarked non-empty directories and project roots.

Target frontend architecture is also gated. `12-target-frontend/source-file-manifest.json` must describe a feature/shared/design-system app: `src/app` for route wiring only, `src/features/<screen-id>/screens` for product screen composition, `src/features/<workflow>/patterns` for workflow patterns, `src/shared/ui` and `src/shared/layout` for contract-bound reusable UI, `src/shared/api` and `src/shared/auth` for external boundaries, and `src/design-system` for tokens. Product UI composition inside route files or `archetype/` scaffold namespaces is drift.

Phase sequencing is encoded in `lifecycle/implementation-phases.json`. It defines the seven phases after plan approval: Gate Model, One-Question Clarification UX, Candidate vs Canonical Contracts, Specialist Skills And Agent Roles, Test And QA Hardening, Verification And Drift Enforcement, and Regression Fixtures. Phase 1 is a hard gate: `needs_clarification` blocks implementation readiness.

Lifecycle convergence is encoded in `governance/convergence-standard.json`. The required answer is `No.` to weak-context code generation, inferred canonical scope without approval, marker-only tests passing, QA without Playwright evidence, and completion with unresolved repair tasks.

Verification is complete only after `verify-target` writes per-scenario Playwright evidence, the repair queue is empty, and `lifecycle/execution-state.json` reports `ready_for_completion: true`. The evidence file grades runtime proof separately from production readiness: `runtime_overall` can pass only when route, state, flow, responsive, accessibility, visual screenshot, and malformed-data scenarios pass, while `manual_reviewed` and `production_integrated` remain pending until external review confirms them.

QA is a lifecycle phase, not a mood. It produces `qa/scenario-catalog.json`, `qa/playwright-results.json`, `qa/malformed-data-results.json`, `qa/accessibility-results.md`, `qa/visual-regression-report.md`, `qa/contract-drift-report.md`, and `10-revision/repair-task-queue.json`.

## Specialist Role Files

The installable harness ships specialist role files in `agents/`:

```txt
product-architect.md
experience-architect.md
frontend-architect.md
design-system-architect.md
frontend-practice-enforcer.md
strict-typescript-developer.md
pixel-perfect-developer.md
accessibility-specialist.md
test-first-developer.md
contract-verifier.md
repair-planner.md
qa-lead.md
playwright-e2e-engineer.md
ui-state-qa.md
malformed-data-qa.md
accessibility-qa.md
visual-regression-qa.md
contract-drift-qa.md
```

Each role defines authority, inputs, outputs, blockers, and handoff rules. No agent can approve its own work.
