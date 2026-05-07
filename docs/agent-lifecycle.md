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

## Agent Rule

Spec-driven development starts from the approved canonical `spec/archetype-spec.json`. Before approval, Archetype emits draft artifacts only and must not ask an implementation agent to write product UI.

Draft design-system review is encoded in `draft/design-system-preview.html` and `draft/design-system-review.md`. The preview is static browser-viewable HTML generated from `draft/design-system.draft.json`; it is not app code and not the source of truth. Users can ask questions or request changes, ambiguous requests return to one clarification question, and Archetype revises the draft JSON before regenerating the preview.

Test-driven implementation starts from `test-first/test-first-contract.json` only after the canonical spec package exists.

The test quality standard lives at `test-first/test-quality-standard.json`. Tests that only prove `[data-archetype-screen]` or marker presence fail `verify-target`; valid tests must prove visible behavior, deterministic states, accessible names and landmarks, route/deep-link behavior, malformed data handling, and desktop/tablet/mobile visual evidence.

Complete packages preserve approval and evidence traceability through `lifecycle/approval-request.md`, `lifecycle/approval-decision.json`, `reviews/specialist-review-summary.md`, `test-results/initial-red-test-run.md`, and `lifecycle/final-readiness-report.md`.

Forbidden lifecycle behavior is encoded in `governance/forbidden-behaviors.json`. The package must reject weak-context code generation, inferred routes treated as accepted routes, warning-based readiness claims, bulk clarification, hidden assumptions, default Vite READMEs, mock-only production claims, generic success-state workflows, marker-only tests, unapproved contract mutation, and QA without Playwright evidence.

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
