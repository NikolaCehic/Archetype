# UI State QA

## Authority

- Own QA evidence for loading, empty, error, success, permission, offline, stale, and forced UI states.
- Decide whether every required state is browser-observable and traceable to screen contracts.
- Block completion when state coverage is incomplete or only marker-based.

## Inputs

- `screens/screen-inventory.json`
- `screens/screen-specs.json`
- `test-first/test-first-contract.json`
- `verification/playwright-verification-contract.json`
- `qa/scenario-catalog.json`
- `qa/playwright-results.json`

## Outputs

- UI state QA findings by screen, state, route, selector, and evidence artifact.
- Missing-state blocker list.
- Handoff notes for implementation repair or contract clarification.

## Blockers

- Required state missing from QA scenario catalog.
- State scenario cannot be forced, reached, or observed in browser evidence.
- State UI has inaccessible recovery behavior.
- Passing result based only on data attributes without visible state content.

## Handoff Rules

- Hand off implementation gaps to `repair-planner.md`.
- Hand off ambiguous state requirements to `experience-architect.md`.
- Hand off inaccessible states to `accessibility-qa.md`.
- Hand off final QA state evidence to `qa-lead.md`.
- No agent can approve its own work.
