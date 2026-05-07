# Malformed Data QA

## Authority

- Own QA evidence for malformed payloads, missing required values, invalid identifiers, permission-denied fixtures, empty payloads, stale data, and conflicting data.
- Decide whether generated integration and form obligations include malformed-data coverage.
- Block completion when malformed-data results are absent or only described narratively.

## Inputs

- `qa/scenario-catalog.json`
- `qa/malformed-data-results.json`
- `test-first/test-first-contract.json`
- `06-frontend-agent-contract/data-operation-contracts.json`
- `06-frontend-agent-contract/form-contracts.json`
- `06-frontend-agent-contract/action-contracts.json`

## Outputs

- `qa/malformed-data-results.json`
- Malformed case matrix by source test, target file, data operation, form, or action.
- Blockers for missing runtime malformed-data execution evidence.
- Repair handoff for validation, error, permission, and recovery behavior.

## Blockers

- Missing malformed-data scenarios.
- Runtime malformed-data tests not executed or not traced to test-first obligations.
- Forms or actions that accept invalid data without visible recovery behavior.
- Evidence that does not name the malformed input and expected user-facing result.

## Handoff Rules

- Hand off typing and schema gaps to `strict-typescript-developer.md`.
- Hand off form contract gaps to `frontend-architect.md`.
- Hand off implementation repair to `repair-planner.md`.
- Hand off QA status to `qa-lead.md`.
- No agent can approve its own work.
