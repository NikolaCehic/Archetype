# Use Archetype With Codex

Archetype should feel like one Codex workflow, not a sequence of user-managed commands.

Setup and lifecycle references: `docs/quickstart.md`, `docs/agent-lifecycle.md`, and `docs/release-readiness.md`.

## Natural Front Door

```txt
$archetype "I want to build a premium B2B analytics app for marketing teams."
```

Codex should:

- treat `$archetype` or a natural-language Archetype request as the full lifecycle by default
- prefer MCP tool `archetype_run_lifecycle` or CLI fallback `archetype run "<brief>"` as the executable lifecycle primitive
- ask clarification questions when product context is incomplete
- invite optional `@` files, screenshots, wireframes, `SPEC.md`, `PRD.md`, brand notes, or repo context
- read the imported `@` files itself
- create `archetype.intake.json`
- generate `archetype-output`
- create executable tests from the generated contract before implementation
- implement from the generated contract
- verify the target frontend
- patch or revise until verification is acceptable
- start generated-package reads from `agent-context/consumer-plane.json`
- read `governance/agent-control-plane.json` before each lifecycle phase transition and stop on P0 blocked or failed gates
- use the Agent Data Plane for deterministic run status, timeline, artifact lineage, verification, and repair queries when available

The lifecycle primitive returns `nextAction` and `consumerPlane`. If `consumerPlane.next_action.type` is `ask_one_question`, ask only that one question. If it is `present_draft_review`, surface `review-console/index.html`, `review-console/session.json`, `draft/design-system-preview.html`, `draft/design-directions.json`, `draft/design-quality-gate.json`, `draft/design-craft-rubric.md`, and the approval request. If it is `start_tests_first`, begin from the compact phase bundles and write tests before UI code. `archetype_consumer_next_action` returns the same host-facing contract without rereading broad artifacts.

The user-facing review surface is the Review Console, not the artifact tree. It shows the current phase, what Archetype knows, what is missing, the one active question, attached materials, route proposals, design-system preview links, approval checklist, blocked reasons, run timeline, and the next legal action.

The user should not need to know `generate`, `validate`, `verify-target`, or which generated file to hand back to Codex.

Codex `@` mentions attach files and folders; they do not invoke Archetype. Use `$archetype` for the workflow, then attach materials with `@`.

## Internal Contract Files

Before approval, Codex starts from `agent-context/consumer-plane.json`, `review-console/session.json`, `progressive/lazy-contract-index.json`, `agent-context/context-summary.json`, `agent-context/phase-bundles/draft-review.json`, `agent-context/phase-bundles/contract-approval.json`, and `governance/agent-control-plane.json`, then reads only the draft artifacts those bundles name. It must not implement from a `draft_contract` package. Draft package manifests expose `compiler_phases`; before approval, canonical, test-first, verification, target, QA, and repair phases must be `skipped`.

When implementation starts, Codex starts from `agent-context/consumer-plane.json`, `review-console/session.json`, `progressive/lazy-contract-index.json`, `orchestration/host-permissions.json`, `governance/agent-control-plane.json`, `agent-context/phase-bundles/test-first.json`, `agent-context/phase-bundles/implementation.json`, and `agent-context/phase-bundles/verification.json`, then reads the required canonical artifacts named by those bundles, such as `spec/archetype-spec.json`, `test-first/test-first-contract.json`, `test-first/test-quality-standard.json`, `implementation-contract.md`, `experience/route-map.json`, `screens/screen-inventory.json`, `design-system/tokens.json`, `04-design-system/design-quality-gate.json`, `04-design-system/shadcn-integration.json`, and `frontend-agent-contract/implementation-rules.json`.

For low-token handoff, create a phase package instead of opening the whole generated directory:

```bash
npx . phase-package --out archetype-output --phase draft_review --target archetype-phase-package --force --json
```

The phase package contains only the consumer plane, review console, current phase bundle, required reads, MCP descriptors, attachment UX, blocker explanations, and orchestration/permission contracts. Deferred artifacts stay out until the consumer plane or phase bundle permits them.

Codex creates the smoke, E2E, UI, integration, and unit tests declared in `test-first/test-first-contract.json` before product UI implementation, preserves the initial red result, then implements until the same tests pass. `test-first/test-quality-standard.json` forbids marker-only tests; `verify-target` fails tests that only check generated markers instead of behavior.

Specialist role files live in `~/plugins/archetype/agents/`. Use the matching role file when the lifecycle needs product architecture, experience architecture, frontend architecture, design-system review, frontend practice enforcement, strict TypeScript work, pixel-perfect polish, accessibility review, test-first development, contract verification, or repair planning. No agent can approve its own work.

After implementation, Codex runs Playwright-backed verification through `archetype verify-target` and checks `lifecycle/execution-state.json`, `lifecycle/final-readiness-report.md`, `verification/playwright-evidence.json`, `verification/playwright-evidence.md`, `qa/scenario-catalog.json`, `qa/playwright-results.json`, `qa/malformed-data-results.json`, `qa/accessibility-results.md`, `qa/visual-regression-report.md`, `qa/contract-drift-report.md`, `10-revision/repair-task-queue.json`, and `10-revision/repair-plan.md`. A completion report must name the Playwright status, QA status, evidence grades, route/state/flow/responsive/accessibility/visual-smoke/malformed-data coverage, repair task count, `ready_for_completion`, and any remaining warning. Passing runtime evidence does not mean `manual_reviewed` or `production_integrated` passed.

If verification fails, Codex calls `archetype_plan_repair` or `archetype repair --out archetype-output --target . --json`, patches implementation tasks first, and revises the contract only when user-approved source evidence proves the canonical spec is wrong.

For implementation, Codex must follow the `12-target-frontend` contract. The target app is feature/shared/design-system structured: `src/app` wires routes only, `src/features/<screen-id>/screens` owns product screens, `src/features/<workflow>/patterns` owns workflow patterns, `src/shared/ui` and `src/shared/layout` own reusable contract-bound UI, `src/shared/api` and `src/shared/auth` own external boundaries, and `src/design-system` owns tokens.

## Use The MCP Server

For MCP-capable Codex workflows, use `docs/use-with-mcp.md` and `mcp.example.json`. The server exposes `archetype_release_doctor`, `archetype_run_lifecycle`, `archetype_create_intake`, `archetype_answer_clarification`, `archetype_generate_package`, `archetype_consumer_next_action`, `archetype_submit_review`, `archetype_phase_package`, `archetype_data_plane_status`, `archetype_data_plane_timeline`, `archetype_data_plane_artifacts`, `archetype_data_plane_read_artifact`, `archetype_data_plane_lifecycle`, `archetype_data_plane_replay_run`, `archetype_validate_package`, `archetype_summarize_package`, `archetype_read_artifact`, `archetype_verify_target`, and `archetype_plan_repair`.

When the Agent Data Plane is present, Codex can query run state instead of rereading large artifacts. The data plane lives under `archetype-output/data-plane/` and is documented in `docs/agent-data-plane.md`.

The MCP server also exposes resources and prompts. Codex agents should list resources/prompts when they need current-phase context, review instructions, or test-first handoff copy without scanning the filesystem.

## Approval Safety

Codex must not authorize implementation by editing intake JSON. A draft becomes canonical only after the human chooses approve and Codex calls `archetype_submit_review` or the CLI fallback `archetype review --decision approve`. The proof binds the draft package id, source hash, package checksum, required artifact hashes, and the draft contract fingerprint. `request_changes` and `reject` are also first-class decisions and never authorize implementation. `governance/agent-control-plane.json` must report canonical parity before implementation begins.

## Verify Before Completion

```bash
npx . summarize --out archetype-output --json
npx . doctor --json
npx . validate --out archetype-output --json
npx . verify-target --out archetype-output --target . --json
npx . repair --out archetype-output --target . --json
```

Codex plugin installation details live in `docs/install-codex-plugin.md`.
