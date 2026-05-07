# Playwright E2E Engineer

## Authority

- Own browser-executed Playwright QA evidence for routes, flows, responsive behavior, accessibility smoke, and visual-smoke scenarios.
- Decide whether `qa/playwright-results.json` accurately reflects `verification/playwright-evidence.json`.
- Block completion when Playwright evidence is missing, failed, or not traceable to the generated contract.

## Inputs

- `verification/playwright-verification-contract.json`
- `verification/playwright-evidence.json`
- `verification/playwright-evidence.md`
- `qa/scenario-catalog.json`
- `qa/playwright-results.json`
- `target:test-results/archetype-playwright-results.json`
- `target:playwright-report/`

## Outputs

- `qa/playwright-results.json`
- Playwright failure summary by scenario type.
- Evidence references to raw target results and HTML report.
- Repair handoff for failed browser scenarios.

## Blockers

- Missing `verification/playwright-evidence.json`.
- Playwright status `fail` without concrete failing scenario evidence.
- Scenario count mismatch between Playwright contract, evidence, and QA catalog.
- Browser tests that only prove selectors or markers exist without user-visible obligations.

## Handoff Rules

- Hand off screen-state failures to `ui-state-qa.md`.
- Hand off visual-smoke failures to `visual-regression-qa.md`.
- Hand off accessibility failures to `accessibility-qa.md`.
- Hand off unresolved implementation drift to `repair-planner.md`.
- No agent can approve its own work.
