# Non-Negotiable Principles Enforcement

Status: enforcement audit and implementation plan for Phase 1.

Source of truth: `HARDENED_ARCHETYPE_LIFECYCLE.md`

Scope: enforce the non-negotiable principles before adding specialist skills, agent role files, QA agents, or broader lifecycle polish.

## Summary

The current lifecycle has the right language, but it is not enforced.

The central fallacy is:

```txt
Archetype treats lifecycle guidance as descriptive metadata instead of an execution gate.
```

The compiler can say:

```txt
lifecycle.status = needs_clarification
```

while also saying:

```txt
readyForFrontendAgent = true
```

That contradiction is the first enforcement target.

## Current-State Probe

Probe input:

```txt
I want to build a admin dashboard for a marketing team
```

Observed current output:

```txt
lifecycleStatus: needs_clarification
nextState: clarifying
confidence: 44
required questions: primary_users, target_stack
readinessScore: 89
readyForFrontendAgent: true
blockers: []
routeCount: 6
routes: /onboarding, /workspaces, /campaigns, /reports/builder, /billing, /settings
testCount: 150
```

Correct output should be:

```txt
lifecycleStatus: needs_clarification
readinessTier: ready_for_clarification
readyForFrontendAgent: false
canonicalSpecGenerated: false
testFirstGenerated: false
targetFrontendGenerated: false
nextQuestion: primary_users
```

## Audited Code Paths

Current lifecycle detection:

- `src/modules/lifecycle.ts:115`
- `src/modules/lifecycle.ts:146`
- `src/modules/lifecycle.ts:155`
- `src/modules/lifecycle.ts:207`

Current compiler order:

- `src/core/pipeline.ts:235`
- `src/core/pipeline.ts:242`
- `src/core/pipeline.ts:244`
- `src/core/pipeline.ts:245`
- `src/core/pipeline.ts:247`
- `src/core/pipeline.ts:291`
- `src/core/pipeline.ts:308`
- `src/core/pipeline.ts:349`
- `src/core/pipeline.ts:354`
- `src/core/pipeline.ts:359`

Current readiness calculation:

- `src/quality/quality.ts:503`
- `src/quality/quality.ts:513`
- `src/quality/quality.ts:521`
- `src/quality/quality.ts:523`

Current evidence fallacy:

- `src/modules/evidence.ts:60`
- `src/modules/evidence.ts:83`
- `src/modules/evidence.ts:131`
- `src/modules/evidence.ts:154`
- `src/modules/evidence.ts:160`
- `src/modules/evidence.ts:165`

Current spec generation:

- `src/modules/spec.ts:244`

Current test-first fallacy:

- `src/modules/testFirstContracts.ts:365`
- `src/modules/testFirstContracts.ts:382`
- `src/modules/testFirstContracts.ts:431`
- `src/modules/testFirstContracts.ts:469`
- `src/modules/testFirstContracts.ts:489`

Current CLI export fallacy:

- `src/cli.ts:142`
- `src/cli.ts:147`
- `src/cli.ts:160`
- `src/cli.ts:163`
- `src/cli.ts:172`

## Fallacy Map

### Fallacy 1: Lifecycle Runs Too Late

Current behavior:

```txt
infer domain
build evidence
build product
build experience
build design system
build frontend contract
build quality
build lifecycle
build spec
build tests
build playwright contract
```

Problem:

Lifecycle is computed after product architecture and contract artifacts already exist.

Required enforcement:

```txt
infer raw context only
build context matrix
build evidence classification
run lifecycle gate
if needs_clarification: stop with clarification package
if draftable: build draft package
if approved: build canonical package
```

### Fallacy 2: Readiness Ignores Lifecycle Status

Current behavior:

`readyForFrontendAgent` only checks hard blockers from quality and score thresholds.

Problem:

Missing context becomes warnings instead of blockers.

Required enforcement:

```txt
if lifecycle.status = needs_clarification:
  readyForFrontendAgent = false
  readinessTier = ready_for_clarification
  blockers include missing required context
```

### Fallacy 3: Inference Becomes Accepted Decision

Current behavior:

Domain profile routes become accepted route decisions through evidence records.

Problem:

`inference_domain_profile` is allowed to produce accepted decisions.

Required enforcement:

```txt
archetype_inference -> candidate only
weak_user_hint -> draft only
explicit_user_answer -> canonical allowed
imported_material_fact -> canonical allowed
repo_fact -> canonical allowed
user_confirmed_assumption -> canonical allowed
```

### Fallacy 4: Spec Generation Has No Context Gate

Current behavior:

`buildSpecArtifacts` runs even when context needs clarification.

Problem:

The generated spec becomes canonical even when the lifecycle knows required decisions are missing.

Required enforcement:

```txt
if readinessTier is not ready_for_test_authoring or later:
  do not build spec/archetype-spec.json
  do not build spec/archetype-spec.md
```

### Fallacy 5: Tests Are Generated Before Approval

Current behavior:

Test-first contracts are generated from unapproved spec artifacts.

Problem:

Tests can certify invented scope.

Required enforcement:

```txt
if contract is not approved:
  do not generate test-first/test-first-contract.json
  do not generate Playwright verification contract
```

### Fallacy 6: Generated Tests Can Be Tautological

Current behavior:

Generated Playwright tests mostly check route markers and state markers.

Problem:

Marker-only tests can pass while real workflows are fake.

Required enforcement:

```txt
test quality gate must fail tests that only assert generated selectors
behavioral assertions must be required for actions, data, forms, states, and route transitions
```

### Fallacy 7: CLI Generates Full Packages For Sparse Context

Current behavior:

The CLI exports a full package regardless of clarification status.

Problem:

The user receives a complete-looking package when Archetype should have stopped.

Required enforcement:

```txt
generate command must export a clarification package when context is weak
summary must say readyForFrontendAgent: false
artifacts must be limited to context, evidence, questions, and next action
```

## Principle-By-Principle Audit

| Principle | Current status | Fallacy | Required enforcement |
| --- | --- | --- | --- |
| No canonical contract from unapproved invention. | Fails | Domain inferences become accepted decisions and canonical routes. | Add evidence levels and prevent inference from canonical artifacts. |
| No spec before context is sufficient for a draft. | Fails | Spec is generated after lifecycle says `needs_clarification`. | Gate `buildSpecArtifacts` behind readiness tier. |
| No implementation before canonical contract is approved. | Fails structurally | Target frontend artifacts and implementation instructions are generated without approval state. | Add approval decision artifact and block implementation artifacts before approval. |
| No product UI before tests are authored from canonical contract. | Partial | Test contract exists, but can be generated from unapproved scope. | Require canonical approved spec before test authoring. |
| No completion before QA evidence and Playwright verification pass. | Partial | Verification exists, but readiness can be true before target execution. | Split `readyForFrontendAgent` from `ready_for_completion`; completion requires QA proof. |
| Inference may propose candidates, but inference cannot accept decisions. | Fails | Inference-backed `decision_*` records are accepted. | Add candidate decision state and canonical evidence guard. |
| Clarification happens one question at a time. | Fails | Current context artifact exposes a bulk question list. | Add `next_question` and queue; user-facing skill asks only one question. |
| No agent may approve its own output. | Not implemented | No specialist review ownership model exists yet. | Defer to specialist phase, but add approval model shape now. |
| All readiness claims must point to artifacts. | Partial | Readiness is calculated from internal checks, not lifecycle gate artifacts. | Add `lifecycle/gate-report.json` and require readiness to cite gate evidence. |
| Every generated route, screen, component, token, action, data operation, and test must trace to approved evidence. | Fails | Many artifacts trace to `inference_domain_profile` or compiler decisions. | Add approved-evidence validator across canonical artifacts. |

## Enforcement Architecture For This Phase

### 1. Add Context Matrix

New artifact:

```txt
lifecycle/context-matrix.json
```

Required fields:

```txt
dimensions[]
decisions[]
hard_blockers[]
next_question
readiness_tier
can_generate_draft
can_generate_canonical_spec
can_generate_tests
can_generate_target_frontend
```

### 2. Add Evidence Levels

New type:

```txt
EvidenceLevel =
  | "unknown"
  | "archetype_inference"
  | "weak_user_hint"
  | "explicit_user_answer"
  | "imported_material_fact"
  | "repo_fact"
  | "user_confirmed_assumption"
```

Canonical evidence levels:

```txt
explicit_user_answer
imported_material_fact
repo_fact
user_confirmed_assumption
```

### 3. Split Package Kinds

Current single package kind is too permissive.

Required package kinds:

```txt
ClarificationPackage
DraftPackage
CanonicalPackage
ImplementationPackage
VerificationPackage
```

Sparse context must return:

```txt
ClarificationPackage
```

It must not return canonical spec, test-first contracts, target frontend files, or implementation instructions.

### 4. Reorder Compiler Pipeline

Required order:

```txt
normalize sources
build initial evidence
build context matrix
build lifecycle gate report
if needs_clarification: return clarification package
build draft product/experience/design/contract
run specialist review gate
if not approved: return draft package
build canonical spec
build test-first contracts
build implementation artifacts
build verification artifacts
```

### 5. Make Readiness Tier The Authority

Replace the single frontend readiness boolean as the source of truth.

Required fields:

```txt
readinessTier
readyForClarification
readyForContractDraft
readyForContractApproval
readyForTestAuthoring
readyForImplementation
readyForQa
readyForCompletion
readyForFrontendAgent
```

Rule:

```txt
readyForFrontendAgent = readyForImplementation
```

It must never be true during clarification.

### 6. Gate CLI, MCP, And Skills

All public entrypoints must obey the same gate:

```txt
CLI generate
MCP generatePackage
Codex skill
Claude command
installer examples
demo scripts
contract scripts
```

Sparse context output must say:

```txt
status: needs_clarification
readyForFrontendAgent: false
nextQuestion: ...
```

### 7. Add Non-Negotiable Regression Tests

Required regression fixtures:

```txt
vague-marketing-dashboard-intake.json
rich-approved-dashboard-intake.json
unapproved-assumption-intake.json
existing-repo-context-intake.json
```

Required assertions:

```txt
vague prompt produces clarification package only
vague prompt has readyForFrontendAgent false
vague prompt has no canonical spec
vague prompt has no test-first contract
vague prompt has one next_question
inferred routes are candidate only
approved assumptions can become canonical
rich approved context can reach ready_for_test_authoring
```

## Phase 1 Work Items

1. Add evidence level and decision status types.
2. Add context matrix builder.
3. Add lifecycle gate report.
4. Reorder compiler so lifecycle gates run before product/experience/design/spec/test generation.
5. Change readiness so `needs_clarification` is a hard blocker.
6. Change sparse package export to clarification-only.
7. Change domain profile decisions from accepted to candidate unless approved.
8. Add `next_question` and stop exposing bulk questions as the user-facing default.
9. Add regression tests for the marketing-dashboard failure.
10. Update CLI/MCP/skill summaries to report lifecycle gate status instead of fake readiness.

## Phase 1 Acceptance Criteria

The phase passes only when:

1. The vague marketing dashboard prompt stops at clarification.
2. `readyForFrontendAgent` is false for weak context.
3. No canonical spec is generated for weak context.
4. No test-first contract is generated for weak context.
5. No implementation instructions are generated for weak context.
6. The user-facing output contains one next question.
7. Inferred routes are candidate decisions only.
8. Readiness cites lifecycle gate artifacts.
9. Existing rich examples still work when they have sufficient approved context.
10. The old contradiction cannot occur:

```txt
lifecycle.status = needs_clarification
readyForFrontendAgent = true
```

## Out Of Scope For This Phase

These are important, but must come after the non-negotiable enforcement gate:

- Specialist frontend best-practice skills.
- Agent role markdown files.
- QA team agent files.
- Pixel-perfect review gates.
- Full behavioral test quality rewrite.
- Playwright visual QA hardening.
- Contract drift QA.

Those later phases rely on this phase. If this enforcement phase is weak, the later agents will only decorate a broken lifecycle.

## Exit Condition

This enforcement phase is complete when the current lifecycle cannot generate canonical implementation artifacts from weak context.

The exact exit question:

```txt
Can Archetype still produce a canonical spec, tests, or implementation instructions while required context is missing?
```

The required answer:

```txt
No.
```
