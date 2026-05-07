# Use Archetype With Claude Code

Archetype should feel like one Claude Code workflow, not a sequence of user-managed commands.

Setup and lifecycle references: `docs/quickstart.md`, `docs/agent-lifecycle.md`, and `docs/release-readiness.md`.

## Natural Front Door

```txt
/archetype "I want to build a premium B2B analytics app for marketing teams."
```

Claude Code should:

- treat `/archetype` as the full lifecycle by default
- ask clarification questions when product context is incomplete
- invite optional `@` files, screenshots, wireframes, `SPEC.md`, `PRD.md`, brand notes, or repo context
- read the imported `@` files itself
- create `archetype.intake.json`
- generate `archetype-output`
- create executable tests from the generated contract before implementation
- implement from the generated contract
- verify the target frontend
- patch or revise until verification is acceptable

The user should not need to know `generate`, `validate`, `verify-target`, or which generated file to hand back to Claude Code.

## Internal Contract Files

Before approval, Claude Code reads `lifecycle/contract-state.json`, `lifecycle/implementation-phases.json`, `draft/design-system.draft.json`, `draft/design-system-preview.html`, `draft/design-system-review.md`, `draft/frontend-contract.draft.json`, `draft/assumption-ledger.md`, `draft/specialist-review.json`, `governance/frontend-practice-skills.json`, `governance/forbidden-behaviors.json`, `governance/convergence-standard.json`, and `draft/contract-approval-request.json`, then asks for approval or edits. It must not implement from a `draft_contract` package.

When implementation starts, Claude Code reads `lifecycle/context-completion.json`, `lifecycle/clarification-turn.json`, `lifecycle/approval-decision.json`, `lifecycle/execution-state.json`, `lifecycle/implementation-phases.json`, `governance/frontend-practice-skills.json`, `governance/forbidden-behaviors.json`, `governance/convergence-standard.json`, `reviews/specialist-review-summary.md`, `spec/archetype-spec.md`, `spec/archetype-spec.json`, `test-first/test-first-contract.json`, `test-first/test-first-plan.md`, `test-first/test-quality-standard.json`, `test-results/initial-red-test-run.md`, `verification/playwright-verification-contract.json`, `verification/playwright-verification-plan.md`, `CLAUDE.md`, `implementation-contract.md`, `experience/route-map.json`, `screens/screen-inventory.json`, `design-system/tokens.json`, and `frontend-agent-contract/implementation-rules.json`.

Claude Code creates the smoke, E2E, UI, integration, and unit tests declared in `test-first/test-first-contract.json` before product UI implementation, preserves the initial red result, then implements until the same tests pass. `test-first/test-quality-standard.json` forbids marker-only tests; `verify-target` fails tests that only check generated markers instead of behavior.

Specialist role files live in `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/agents/`. Use the matching role file when the lifecycle needs product architecture, experience architecture, frontend architecture, design-system review, frontend practice enforcement, strict TypeScript work, pixel-perfect polish, accessibility review, test-first development, contract verification, or repair planning. No agent can approve its own work.

After implementation, Claude Code runs Playwright-backed verification through `archetype verify-target` and checks `lifecycle/execution-state.json`, `lifecycle/final-readiness-report.md`, `verification/playwright-evidence.json`, `verification/playwright-evidence.md`, `qa/scenario-catalog.json`, `qa/playwright-results.json`, `qa/malformed-data-results.json`, `qa/accessibility-results.md`, `qa/visual-regression-report.md`, `qa/contract-drift-report.md`, `10-revision/repair-task-queue.json`, and `10-revision/repair-plan.md`. A completion report must name the Playwright status, QA status, route/state/flow/responsive/accessibility/visual-smoke coverage, repair task count, `ready_for_completion`, and any remaining warning.

If verification fails, Claude Code calls `archetype_plan_repair` or `archetype repair --out archetype-output --target . --json`, patches implementation tasks first, and revises the contract only when user-approved source evidence proves the canonical spec is wrong.

## Use The MCP Server

For MCP-capable Claude Code workflows, use `docs/use-with-mcp.md` and `mcp.example.json`. The server exposes `archetype_release_doctor`, `archetype_create_intake`, `archetype_answer_clarification`, `archetype_generate_package`, `archetype_validate_package`, `archetype_summarize_package`, `archetype_read_artifact`, `archetype_verify_target`, and `archetype_plan_repair`.

## Verify Before Completion

```bash
npx . summarize --out archetype-output --json
npx . doctor --json
npx . validate --out archetype-output --json
npx . verify-target --out archetype-output --target . --json
npx . repair --out archetype-output --target . --json
```

Claude Code plugin installation details live in `docs/install-claude-code-plugin.md`.
