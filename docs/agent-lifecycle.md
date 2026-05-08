# Agent Lifecycle

Archetype is a self-contained agent harness. The user should only need a natural-language idea and optional `@` file imports.

## Flow

```txt
idea
  -> clarify missing context one question at a time
  -> ask for optional materials
  -> intake source evidence
  -> generate draft contract
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

The user should not need to say:

```txt
Build this frontend. Ask me what is missing, then implement and verify.
```

That is the default lifecycle.

## Context Artifacts

Agents should begin with the compact context surface:

```txt
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

The phase bundle is the first-read artifact for the current lifecycle phase. It lists required reads, optional reads, MCP query hints, the entry gate, the exit gate, and the policy for when a full artifact read is justified.

Every generated package includes:

```txt
lifecycle/context-completion.json
lifecycle/clarification-turn.json
lifecycle/implementation-phases.json
lifecycle/contract-state.json
lifecycle/execution-state.json
lifecycle/lifecycle-report.md
draft/frontend-contract.draft.json
draft/design-system-preview.html
draft/design-system-review.md
draft/assumption-ledger.md
governance/forbidden-behaviors.json
governance/convergence-standard.json
governance/frontend-practice-skills.json
draft/contract-approval-request.json
```

The Agent Data Plane augments those artifacts with replayable run records under `data-plane/runs/<run-id>/`. It records lifecycle gates, evidence summaries, contract refs, verification status, repair provenance, and generated artifact lineage without replacing the contract artifacts themselves. See `docs/agent-data-plane.md`.

## Agent Rule

Spec-driven development starts from the approved canonical `spec/archetype-spec.json`. Before approval, Archetype emits draft artifacts only and must not ask an implementation agent to write product UI.

Approval is bound to generated evidence, not to a mutable boolean in the intake file. The CLI path is:

```bash
archetype generate --input archetype.intake.json --out archetype-output --json
archetype approve-draft --draft archetype-output --input archetype.intake.json --out archetype.approved.intake.json --approved-by "Human reviewer" --json
archetype generate --input archetype.approved.intake.json --out archetype-output --force --json
```

`approve-draft` records the draft package id, source hash, package checksum, approval digest, and hashes for required draft artifacts. A raw `contractApproval` object without the approval proof remains blocked.

The compiler is phase-safe. Draft packages include a `compiler_phases` manifest trace showing context, draft, and approval as constructed while canonical, test-first, verification, target, QA, and repair phases remain skipped. Those later phases are not constructed in memory or written to disk until the bound approval proof is regenerated into a canonical package.

Draft design-system review is encoded in `draft/design-system-preview.html` and `draft/design-system-review.md`. The preview is static browser-viewable HTML generated from `draft/design-system.draft.json`; it is not app code and not the source of truth. Users can ask questions or request changes, ambiguous requests return to one clarification question, and Archetype revises the draft JSON before regenerating the preview.

Test-driven implementation starts from `test-first/test-first-contract.json` only after the canonical spec package exists.

The test quality standard lives at `test-first/test-quality-standard.json`. Tests that only prove `[data-archetype-screen]` or marker presence fail `verify-target`; valid tests must prove visible behavior, deterministic states, accessible names and landmarks, route/deep-link behavior, malformed data handling, and desktop/tablet/mobile visual evidence.

Complete packages preserve approval and evidence traceability through `lifecycle/approval-request.md`, `lifecycle/approval-decision.json`, `reviews/specialist-review-summary.md`, `test-results/initial-red-test-run.md`, and `lifecycle/final-readiness-report.md`.

Token-bounded context is part of the lifecycle. `archetype_summarize_package` defaults to compact MCP output, `archetype summarize --compact` returns only the compact entrypoints, and `archetype_read_artifact` returns bounded content with `nextRead` continuation instructions for large artifacts.

Forbidden lifecycle behavior is encoded in `governance/forbidden-behaviors.json`. The package must reject weak-context code generation, inferred routes treated as accepted routes, warning-based readiness claims, bulk clarification, hidden assumptions, default Vite READMEs, mock-only production claims, generic success-state workflows, marker-only tests, unapproved contract mutation, and QA without Playwright evidence.

Generated output safety is part of the lifecycle. `archetype-output/` and generated target frontends carry marker files so commands can distinguish Archetype-owned output from user projects. Recursive overwrite is refused for unmarked non-empty directories and project roots.

Phase sequencing is encoded in `lifecycle/implementation-phases.json`. It defines the seven phases after plan approval: Gate Model, One-Question Clarification UX, Candidate vs Canonical Contracts, Specialist Skills And Agent Roles, Test And QA Hardening, Verification And Drift Enforcement, and Regression Fixtures. Phase 1 is a hard gate: `needs_clarification` blocks implementation readiness.

Lifecycle convergence is encoded in `governance/convergence-standard.json`. The required answer is `No.` to weak-context code generation, inferred canonical scope without approval, marker-only tests passing, QA without Playwright evidence, and completion with unresolved repair tasks.

Verification is complete only after `verify-target` writes Playwright evidence, the repair queue is empty, and `lifecycle/execution-state.json` reports `ready_for_completion: true`.

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
