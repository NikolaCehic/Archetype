# Hardened Archetype Lifecycle

Status: source-of-truth lifecycle plan before implementation.

Purpose: define the hardened Archetype protocol that prevents weak context from becoming fake certainty, blocks code generation until the contract is evidence-backed, and turns specialist frontend practice, agent roles, and QA into first-class lifecycle gates.

## Core Problem

Archetype can currently detect weak context, but it does not obey that signal strongly enough.

The failed manual test was:

```txt
I want to build a admin dashboard for a marketing team
```

Correct behavior:

```txt
Archetype should stop, ask one clarification question, and build a context matrix.
```

Incorrect behavior:

```txt
Archetype generated a full app, invented product details, generated shallow tests, and produced false confidence.
```

The lifecycle must make that impossible.

## Non-Negotiable Principles

1. No canonical contract from unapproved invention.
2. No spec before context is sufficient for a draft.
3. No implementation before the canonical contract is approved.
4. No product UI before tests are authored from the canonical contract.
5. No completion before QA evidence and Playwright-backed verification pass.
6. Inference may propose candidates, but inference cannot accept decisions.
7. Clarification happens one question at a time.
8. No agent may approve its own output.
9. All readiness claims must point to artifacts.
10. Every generated route, screen, component, token, action, data operation, and test must trace to approved evidence.

## Evidence Levels

Every lifecycle decision must be tagged with one evidence level.

| Level | Meaning | Can become canonical? |
| --- | --- | --- |
| `unknown` | No evidence exists. | No |
| `archetype_inference` | Archetype inferred it from category, keywords, or patterns. | No |
| `weak_user_hint` | The user hinted at it, but did not define it enough for implementation. | Draft only |
| `explicit_user_answer` | The user directly answered the decision. | Yes |
| `imported_material_fact` | The decision is present in an imported spec, PRD, screenshot, wireframe, design file, or notes. | Yes |
| `repo_fact` | The decision is proven by the target repository. | Yes |
| `user_confirmed_assumption` | Archetype proposed it and the user approved it. | Yes |

Canonical implementation decisions may only use:

```txt
explicit_user_answer
imported_material_fact
repo_fact
user_confirmed_assumption
```

Everything else must remain a candidate, warning, blocker, or question.

## Context Sufficiency Gate

Weak context means the next artifact would depend on unapproved invention.

It does not mean the prompt is short. A short prompt can be sufficient if imported files or repo facts answer the missing decisions. A long prompt can still be weak if it lacks implementation-critical facts.

### Required Context Dimensions

| Dimension | Blocks implementation? | Minimum evidence for canonical contract |
| --- | --- | --- |
| Product outcome | Yes | `explicit_user_answer`, `imported_material_fact`, or `user_confirmed_assumption` |
| Primary users and roles | Yes | `explicit_user_answer`, `imported_material_fact`, `repo_fact`, or `user_confirmed_assumption` |
| Must-have workflows or screens | Yes | `explicit_user_answer`, `imported_material_fact`, `repo_fact`, or `user_confirmed_assumption` |
| Target repo or frontend stack | Yes | `repo_fact`, `explicit_user_answer`, or `user_confirmed_assumption` |
| Mock, API, data, auth, and permission boundary | Yes | `explicit_user_answer`, `imported_material_fact`, `repo_fact`, or `user_confirmed_assumption` |
| Design direction or permission to create one | Yes for production UI | `explicit_user_answer`, `imported_material_fact`, `repo_fact`, or `user_confirmed_assumption` |
| Test and Playwright execution permission | Yes | `explicit_user_answer`, repo policy, or session permission |
| Assumption approval | Yes | `user_confirmed_assumption` |
| Safety, regulated, compliance, or sensitive-data constraints | Yes when detected | `explicit_user_answer`, `imported_material_fact`, or `repo_fact` |

### Decision Statuses

Every decision in the context matrix must have one status:

```txt
confirmed
candidate
missing
conflicted
blocked
```

Rules:

- `confirmed` decisions can enter the canonical contract.
- `candidate` decisions can appear in the contract draft only.
- `missing` decisions feed the one-question clarification queue.
- `conflicted` decisions require resolution before draft approval.
- `blocked` decisions stop the lifecycle until the blocker is removed.

### Readiness Tier

Readiness is not a single boolean.

| Tier | Meaning |
| --- | --- |
| `ready_for_clarification` | Archetype has an idea or change intent and can ask the next question. |
| `ready_for_contract_draft` | Required context is enough to propose a draft with candidate assumptions marked. |
| `ready_for_contract_approval` | Draft is internally reviewed and all blockers are resolved or explicitly marked as assumptions. |
| `ready_for_test_authoring` | User approved the contract or approved the assumption set. |
| `ready_for_implementation` | Test files exist, initial red evidence is captured, and implementation rules are canonical. |
| `ready_for_qa` | Implementation claims to satisfy the contract and all tests can run. |
| `ready_for_completion` | QA, Playwright evidence, contract drift checks, and repair queue are clean. |

Hard blockers always override numeric scores.

## Clarification UX

Clarification is not a bulk form.

Archetype asks exactly one question at a time, chosen by highest implementation impact.

### Clarification Algorithm

```txt
1. Read idea, imported files, screenshots, and repo context.
2. Build context matrix.
3. Mark every required decision as confirmed, candidate, missing, conflicted, or blocked.
4. Select the highest-impact missing or conflicted blocker.
5. Ask exactly one question.
6. Update the context matrix from the answer.
7. Repeat until the next lifecycle gate is safe.
8. Present assumptions and candidate decisions for approval.
9. Generate the canonical contract only after approval.
```

### Default Question Priority

1. Who is the primary user or role?
2. What are the must-have workflows or screens?
3. Should this use an existing repo or create a new frontend project?
4. Is this mock-only, fixture-backed, API-backed, or integrated with an existing backend?
5. What visual direction, screenshots, wireframes, brand notes, or design files should be used?
6. Can Archetype generate tests, install dependencies, and run Playwright?
7. Do you approve the assumption set and contract direction?

Archetype must skip questions already answered by imported material or repo facts.

### Example Correct First Response

For:

```txt
/archetype "I want to build an admin dashboard for a marketing team"
```

Correct:

```txt
I can build this, but I need one decision before I can generate a reliable contract.

Who is the primary user of this dashboard: campaign operator, marketing executive, growth analyst, agency admin, or someone else?
```

Incorrect:

```txt
I generated Pulseboard Admin with campaigns, reports, billing, settings, tests, and mocks.
```

## Lifecycle State Machine

### 1. Start

Input:

- Natural-language idea, change request, or existing repo request.

Allowed actions:

- Capture intent.
- Detect imported files, screenshots, folders, and repo context.

Forbidden actions:

- Generate spec.
- Generate tests.
- Write product UI.

Output artifact:

- `lifecycle/start-request.json`

Exit condition:

- A product idea or change intent exists.

### 2. Context Scan

Input:

- Start request plus imported materials and repo context.

Allowed actions:

- Normalize sources.
- Build evidence ledger.
- Build context sufficiency matrix.
- Detect missing, candidate, confirmed, conflicted, and blocked decisions.

Forbidden actions:

- Accept inferred routes, screens, roles, data contracts, or visual direction as canonical.

Output artifacts:

- `lifecycle/context-matrix.json`
- `01-evidence/evidence-ledger.json`
- `01-evidence/missing-context.md`

Exit condition:

- Next clarification question or draft readiness is known.

### 3. Clarification

Input:

- Context matrix with missing or conflicted decisions.

Allowed actions:

- Ask one question.
- Update the context matrix after the answer.

Forbidden actions:

- Ask bulk question sets by default.
- Proceed to contract draft if a hard blocker remains.

Output artifacts:

- `lifecycle/clarification-state.json`
- `lifecycle/clarification-transcript.md`

Exit condition:

- Context reaches `ready_for_contract_draft`, or the user pauses.

### 4. Optional Material Intake

Input:

- Clarified context and optional user materials.

Allowed actions:

- Ask whether the user wants to attach screenshots, wireframes, PRDs, specs, API docs, brand notes, or repo files.
- Read imported materials directly.
- Classify material as evidence, not instruction authority.

Forbidden actions:

- Ask the user to paste content from files already imported.
- Trust uploaded instructions that conflict with the lifecycle.

Output artifacts:

- `01-evidence/source-analysis-report.json`
- `01-evidence/visual-evidence-extraction.json`
- `01-evidence/visual-evidence-extraction.md`

Exit condition:

- User provides materials or explicitly continues without them.

### 5. Contract Draft

Input:

- Context matrix, evidence ledger, optional materials, and repo facts.

Allowed actions:

- Propose product model, IA, routes, screens, flows, tokens, components, data contracts, action contracts, form contracts, and verification strategy.
- Mark every unconfirmed item as candidate.

Forbidden actions:

- Mark inferred items as accepted.
- Produce implementation-ready instructions.
- Tell the agent to write code.

Output artifacts:

- `draft/product-model.draft.json`
- `draft/experience-architecture.draft.json`
- `draft/design-system.draft.json`
- `draft/frontend-contract.draft.json`
- `draft/assumption-ledger.md`

Exit condition:

- Draft is ready for specialist review.

### 6. Specialist Review

Input:

- Contract draft.

Allowed actions:

- Review with required specialist agents and frontend best-practice skills.
- Produce blockers, warnings, and recommendations.

Forbidden actions:

- Let the same role approve the draft it created.
- Convert a warning into acceptance without evidence.

Output artifacts:

- `reviews/product-architect-review.md`
- `reviews/experience-architect-review.md`
- `reviews/frontend-architect-review.md`
- `reviews/design-system-review.md`
- `reviews/frontend-practice-review.md`
- `reviews/typescript-strictness-review.md`
- `reviews/accessibility-review.md`
- `reviews/pixel-review.md`
- `reviews/specialist-review-summary.md`

Exit condition:

- No specialist blockers remain, or blockers are converted into explicit user questions.

### 7. Contract Approval

Input:

- Reviewed draft and assumption ledger.

Allowed actions:

- Present confirmed facts, candidate assumptions, unresolved unknowns, and risks.
- Ask for approval or edits.

Forbidden actions:

- Generate canonical spec without approval.
- Hide assumptions in generated artifacts.

Output artifacts:

- `lifecycle/approval-request.md`
- `lifecycle/approval-decision.json`

Exit condition:

- User approves the contract or confirms assumptions.

### 8. Canonical Spec Generation

Input:

- Approved draft and approval decision.

Allowed actions:

- Generate canonical spec and agent contract.
- Freeze route, screen, state, token, component, data, action, form, and verification contracts.

Forbidden actions:

- Add new product scope not present in approved contract.

Output artifacts:

- `spec/archetype-spec.json`
- `spec/archetype-spec.md`
- `frontend-agent-contract/implementation-rules.json`
- `frontend-agent-contract/frontend-agent-instructions.md`
- `frontend-agent-contract/acceptance-criteria.json`

Exit condition:

- Canonical spec is valid and traceable.

### 9. Test-First Authoring

Input:

- Canonical spec.

Allowed actions:

- Generate smoke, E2E, UI, accessibility, integration, and unit test obligations.
- Materialize tests in the target repo before product UI.
- Run initial red tests and preserve evidence.

Forbidden actions:

- Write product UI before tests.
- Generate tests that only prove generated markers exist.
- Delete, weaken, skip, or rewrite tests to make implementation pass.

Output artifacts:

- `test-first/test-first-contract.json`
- `test-first/test-first-plan.md`
- `test-results/initial-red-test-run.md`

Exit condition:

- Required tests exist and initial red result is captured.

### 10. Implementation

Input:

- Canonical spec, implementation contract, test-first contract, and initial red evidence.

Allowed actions:

- Build the frontend from the contract.
- Use approved specialist guidance.
- Keep changes within target architecture and file manifest.

Forbidden actions:

- Invent routes, screens, actions, entities, visual systems, or data behavior outside the spec.
- Replace real behavior with generic success panels.
- Use untyped escape hatches to bypass contracts.

Output artifacts:

- Target frontend source files.
- Test run evidence.
- Implementation notes.

Exit condition:

- Tests pass locally and implementation is ready for QA.

### 11. QA Verification

Input:

- Implemented target frontend and canonical contract.

Allowed actions:

- Run Playwright.
- Generate scenario catalog.
- Test malformed data, edge states, accessibility, responsiveness, and visual evidence.
- Detect contract drift.

Forbidden actions:

- Treat passing smoke tests as sufficient QA.
- Ignore visual or behavioral drift because selectors exist.

Output artifacts:

- `qa/scenario-catalog.json`
- `qa/playwright-results.json`
- `qa/malformed-data-results.json`
- `qa/accessibility-results.md`
- `qa/visual-regression-report.md`
- `qa/contract-drift-report.md`
- `verification/playwright-evidence.json`
- `verification/playwright-evidence.md`

Exit condition:

- QA passes or repair tasks are generated.

### 12. Repair or Revision

Input:

- QA findings, Playwright evidence, and drift report.

Allowed actions:

- Patch implementation drift first.
- Revise contract only when new approved evidence proves the canonical spec is wrong.

Forbidden actions:

- Revise contract to excuse a bad implementation.
- Close with an unresolved repair queue.

Output artifacts:

- `10-revision/repair-task-queue.json`
- `10-revision/repair-plan.md`
- `10-revision/drift-report.md`

Exit condition:

- Repair queue is empty, or unresolved work is explicitly blocked with evidence.

### 13. Completion

Input:

- Passing QA, Playwright evidence, contract adherence proof, and empty repair queue.

Allowed actions:

- Produce final report.

Forbidden actions:

- Claim production readiness without evidence.
- Claim accessibility compliance without human or tool-backed review.

Output artifacts:

- `lifecycle/final-readiness-report.md`
- `verification/final-contract-adherence.md`

Exit condition:

- `ready_for_completion` is true.

## Frontend Best-Practice Skills

These skills are lifecycle gates. They are not optional advice.

| Skill | Owns | Blocks on |
| --- | --- | --- |
| `frontend-architecture` | App structure, feature boundaries, routing, adapters, state ownership | Monolithic app, fake routing, missing adapters, unclear boundaries |
| `react-practices` | Component composition, hooks, effects, controlled state, rendering hygiene | Side-effect abuse, uncontrolled interaction state, brittle component design |
| `typescript-strictness` | Contract typing, discriminated states, typed adapters, no loose data | `any`, untyped mocks, stringly-typed contracts, invalid state unions |
| `design-system-practices` | Tokens, shadcn usage, component variants, reusable primitives | Raw style drift, missing component APIs, invented component behavior |
| `accessibility-practices` | Keyboard, focus, landmarks, names, status, WCAG AA | Missing names, broken focus, color-only status, invalid semantics |
| `forms-and-validation` | Field states, schemas, validation timing, success/error handling | Fake forms, no field-level errors, no dirty/loading/submission model |
| `data-contract-practices` | Loading, empty, partial, stale, offline, permissions, adapters | Generic mocks, no real state transitions, data hidden behind success panels |
| `responsive-practices` | Mobile/tablet/desktop layout and flow preservation | Horizontal overflow, broken mobile workflows, hidden critical actions |
| `performance-practices` | Bundle, render cost, route splitting, chart/data cost | Oversized bundles, unnecessary heavy chart usage, render churn |
| `visual-polish-practices` | Spacing, typography, hierarchy, density, screenshots | Generic dashboard slop, poor alignment, unpolished responsive states |
| `testing-practices` | TDD, behavior-first tests, assertion quality | Marker-only tests, tautological tests, tests that mirror implementation |

## Agent Role Files

The repository should contain role-specific agent instructions. Each agent must define authority, inputs, outputs, blockers, and handoff rules.

| Agent | Role |
| --- | --- |
| `product-architect.md` | Owns product model, users, jobs, goals, assumptions, and scope boundaries. |
| `experience-architect.md` | Owns IA, routes, navigation, workflows, screen inventory, and state matrices. |
| `frontend-architect.md` | Owns target architecture, routing strategy, adapters, file manifest, and implementation boundaries. |
| `design-system-architect.md` | Owns tokens, typography, shadcn component strategy, component APIs, and patterns. |
| `frontend-practice-enforcer.md` | Enforces frontend best practices across architecture, components, state, data, and styling. |
| `strict-typescript-developer.md` | Enforces type safety, discriminated unions, strict adapters, and no loose contract bypasses. |
| `pixel-perfect-developer.md` | Owns visual precision, spacing, hierarchy, screenshot review, responsive polish, and UI craft. |
| `accessibility-specialist.md` | Owns accessibility contract, semantic review, keyboard flow, focus, and status announcements. |
| `test-first-developer.md` | Owns test authoring before implementation and preserves initial red evidence. |
| `contract-verifier.md` | Compares implementation against canonical spec and flags drift. |
| `repair-planner.md` | Converts failures into ordered repair tasks and decides implementation repair vs contract revision. |

Rule:

```txt
No agent can approve its own work.
```

## QA Team

QA is a lifecycle phase with its own agents and artifacts.

| QA Agent | Owns |
| --- | --- |
| `qa-lead.md` | QA plan, coverage strategy, final QA readiness. |
| `playwright-e2e-engineer.md` | Browser-visible flows, route transitions, E2E scenario execution. |
| `ui-state-qa.md` | Loading, empty, error, permission, offline, partial, stale, filtered, validation, and success states. |
| `malformed-data-qa.md` | Bad data, missing fields, long text, invalid enum values, broken dates, permission mismatch. |
| `accessibility-qa.md` | Keyboard navigation, accessible names, landmarks, focus, status semantics, contrast evidence. |
| `visual-regression-qa.md` | Screenshots, viewport matrix, pixel-level layout review, visual drift. |
| `contract-drift-qa.md` | Detects invented routes, screens, components, copy, data behavior, and unsupported assumptions. |

QA must generate:

```txt
qa/scenario-catalog.json
qa/playwright-results.json
qa/malformed-data-results.json
qa/accessibility-results.md
qa/visual-regression-report.md
qa/contract-drift-report.md
10-revision/repair-task-queue.json
```

## Test Quality Standard

Tests must prove behavior, not generated markers.

Forbidden test patterns:

- Only checking that `[data-archetype-screen]` exists.
- Clicking a generic primary button and accepting any success message.
- Testing contract arrays without importing target behavior.
- Treating screenshot byte size as visual quality.
- Mirroring implementation constants as expected values without independent contract expectations.

Required test behaviors:

- Search filters real visible results or shows a filtered-empty state with reset.
- Create actions open a form or mutation workflow.
- Export produces a declared artifact, callback, or mock adapter result.
- Loading, empty, error, permission, offline, partial, stale, validation, and success states are reachable through deterministic fixtures.
- Route transitions and deep links are browser-observable.
- Keyboard, focus, accessible names, landmarks, and live/status regions are tested.
- Long labels, missing data, malformed data, and permission mismatches are tested.
- Visual evidence covers desktop, tablet, and mobile.

## Required Package Artifacts

Every complete Archetype package must include:

```txt
lifecycle/context-matrix.json
lifecycle/clarification-state.json
lifecycle/clarification-transcript.md
lifecycle/approval-request.md
lifecycle/approval-decision.json
01-evidence/evidence-ledger.json
01-evidence/missing-context.md
draft/assumption-ledger.md
reviews/specialist-review-summary.md
spec/archetype-spec.json
spec/archetype-spec.md
frontend-agent-contract/frontend-agent-instructions.md
frontend-agent-contract/implementation-rules.json
frontend-agent-contract/acceptance-criteria.json
test-first/test-first-contract.json
test-first/test-first-plan.md
test-results/initial-red-test-run.md
qa/scenario-catalog.json
qa/playwright-results.json
qa/malformed-data-results.json
qa/accessibility-results.md
qa/visual-regression-report.md
qa/contract-drift-report.md
verification/playwright-evidence.json
verification/playwright-evidence.md
10-revision/repair-task-queue.json
lifecycle/final-readiness-report.md
```

Generated target frontend repositories must preserve the relevant `archetype-output` package or a traceable copy of the canonical contract.

## Forbidden Behaviors

Archetype must never:

- Generate code from weak context.
- Treat inferred routes as accepted routes.
- Treat warnings as readiness.
- Ask bulk questions when one-question clarification is possible.
- Hide assumptions inside product copy or route names.
- Generate a default Vite README as the final project README.
- Claim production-grade output from mock-only interactions.
- Replace real workflows with generic success states.
- Generate tests that only validate its own markers.
- Let implementation mutate the contract without approved evidence.
- Let QA pass without Playwright evidence.

## Acceptance Criteria

The hardened lifecycle passes only if these are true:

1. Given a vague prompt, Archetype stops at clarification.
2. Given missing primary users, Archetype asks only the primary-user question first.
3. Given missing workflows, Archetype asks for workflows before inventing route maps.
4. Given missing target stack, Archetype asks for repo or stack before implementation instructions.
5. Given missing data/auth boundary, Archetype blocks production contracts until mock/API/backend assumptions are approved.
6. Given missing visual direction, Archetype asks whether to import materials or create a design direction from approved assumptions.
7. Given unapproved inferred routes, the contract labels them as candidates.
8. Given approved assumptions, the contract records them as `user_confirmed_assumption`.
9. Given shallow tests, the verifier fails the test quality gate.
10. Given implementation drift, QA creates repair tasks.
11. Given an empty repair queue and passing QA evidence, Archetype can complete.

## Marketing Dashboard Replay

Input:

```txt
/archetype "I want to build an admin dashboard for a marketing team"
```

Expected state:

```txt
ready_for_clarification
```

Confirmed facts:

```txt
product surface: admin dashboard
domain hint: marketing
```

Candidate assumptions:

```txt
possible users: campaign operator, marketing executive, growth analyst, agency admin
possible routes: campaigns, reports, budget, settings
possible data: campaigns, spend, ROAS, CAC, channel performance
possible visual direction: dense operational dashboard
```

Missing blockers:

```txt
primary user
must-have workflows
target repo or stack
mock/API/backend boundary
design direction or permission to create one
test and Playwright permission
assumption approval
```

Correct next question:

```txt
Who is the primary user of this marketing admin dashboard?
```

## Implementation Phases After This Plan Is Approved

No implementation starts until this document is accepted as the lifecycle source of truth.

### Phase 1: Gate Model

- Add context matrix types.
- Add evidence levels.
- Add readiness tiers.
- Make `needs_clarification` block implementation readiness.

### Phase 2: One-Question Clarification UX

- Add question priority.
- Persist clarification state.
- Ask one question at a time.
- Resume lifecycle after each answer.

### Phase 3: Candidate vs Canonical Contracts

- Split draft contract from canonical spec.
- Prevent inferred decisions from becoming accepted.
- Add approval artifacts.

### Phase 4: Specialist Skills And Agent Roles

- Add frontend best-practice skills.
- Add role-specific agent MD files.
- Add no-self-approval review rules.

### Phase 5: Test And QA Hardening

- Replace marker-only tests with behavioral test obligations.
- Add QA team artifacts.
- Add malformed data and visual regression requirements.

### Phase 6: Verification And Drift Enforcement

- Add test-quality verifier.
- Add contract drift QA.
- Add repair queue enforcement.

### Phase 7: Regression Fixtures

- Add the marketing-dashboard vague prompt as a regression.
- Add rich-context prompt regression.
- Add imported-material regression.
- Add existing-repo regression.

## Convergence Standard

This lifecycle is acceptable only when Archetype cannot answer the following with any meaningful "yes":

```txt
Can weak context still produce code?
Can inferred scope become canonical without approval?
Can tests pass while proving only generated markers?
Can QA pass without Playwright evidence?
Can completion happen with unresolved repair tasks?
```

If any answer is yes, the lifecycle is not hardened enough.
