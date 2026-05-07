---
tags:
  - hardened-lifecycle
  - scope
  - leaf
  - artifacts
status: active
scope_id: HL-12
---

# Scope 12 - Required Package Artifacts

Parent: [[00 Maps/HARDENED_ARCHETYPE_LIFECYCLE Node]]

## Scope

Define the artifact shape of a complete package.

## Required Artifacts

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

## Exit Condition

Every complete package preserves traceable contract evidence.

