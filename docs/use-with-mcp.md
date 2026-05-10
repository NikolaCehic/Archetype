# Use With MCP

Archetype includes a local MCP stdio server for agent hosts that can call tools directly.

## Local Development

Build the package:

```bash
npm install
npm run build
```

Run the MCP server:

```bash
npm run mcp
```

## MCP Config

Use `mcp.example.json` as the package config template:

```json
{
  "mcpServers": {
    "archetype": {
      "command": "npx",
      "args": ["--yes", "--package", "github:NikolaCehic/Archetype", "archetype-mcp"]
    }
  }
}
```

Local source variant:

```json
{
  "mcpServers": {
    "archetype": {
      "command": "node",
      "args": ["/absolute/path/to/Archetype/dist/mcp/server.js"]
    }
  }
}
```

Current GitHub package form:

```json
{
  "mcpServers": {
    "archetype": {
      "command": "npx",
      "args": ["--yes", "--package", "github:NikolaCehic/Archetype", "archetype-mcp"]
    }
  }
}
```

## Tools

- `archetype_create_intake`
- `archetype_release_doctor`
- `archetype_run_lifecycle`
- `archetype_answer_clarification`
- `archetype_generate_package`
- `archetype_consumer_next_action`
- `archetype_phase_package`
- `archetype_data_plane_status`
- `archetype_data_plane_timeline`
- `archetype_data_plane_artifacts`
- `archetype_data_plane_read_artifact`
- `archetype_data_plane_lifecycle`
- `archetype_data_plane_replay_run`
- `archetype_validate_package`
- `archetype_summarize_package`
- `archetype_read_artifact`
- `archetype_verify_target`
- `archetype_plan_repair`

The tools are deterministic wrappers around lifecycle running, intake creation, one-question clarification updates, compiler output, package validation, artifact reading, target verification, and repair-task planning. They do not run a general-purpose agent.

`archetype_run_lifecycle` is the preferred backing tool for `$archetype` and `/archetype`. It accepts a natural-language `brief`, optional `materialPaths` or inline `materials`, and continuation fields for one clarification answer or human approval. It writes `lifecycle/source-graph.json`, `lifecycle/run-state.json`, and `agent-context/consumer-plane.json`. The returned `nextAction.type` is one of `ask_clarification`, `review_draft`, or `implement_tests_first`; the returned `consumerPlane.next_action` is the compact host-facing contract.

`archetype_consumer_next_action` returns only the consumer plane. Use it when a host needs to know what to say next, which phase is active, and which artifacts are legal to read without rereading the whole package.

`archetype_phase_package` creates a small phase-scoped handoff directory from an existing generated package. It copies the consumer plane, review console, active phase bundle, required reads, MCP descriptors, orchestration/permission artifacts, and source-material UX while deferring broad contract artifacts.

Every generated package also includes `governance/agent-control-plane.json`. MCP hosts should read it before moving phases. P0 blocked or failed gates stop the lifecycle; the host may not override the control plane.

`archetype_summarize_package` defaults to compact output. It returns `agent-context/consumer-plane.json`, `agent-context/context-summary.json`, and `agent-context/phase-bundles/index.json` as the first-read artifacts plus phase bundle references. Pass `mode: "compat"` only when a legacy host needs the older broad entrypoint list.

`archetype_read_artifact` is bounded by default. Use `maxBytes` and `offset` for continuation reads; the response returns `truncated` and `nextRead` when a larger artifact needs another slice.

The Agent Data Plane query tools read `archetype-output/data-plane/` and do not call an LLM:

- `archetype_data_plane_status`
- `archetype_data_plane_timeline`
- `archetype_data_plane_artifacts`
- `archetype_data_plane_read_artifact`
- `archetype_data_plane_lifecycle`
- `archetype_data_plane_replay_run`

Use them before broad artifact reads when an agent only needs run status, filtered event history, hot artifact lineage, lifecycle/readiness projections, or replay state. MCP timeline and artifact queries are capped by default and accept explicit `limit` filters. See `docs/agent-data-plane.md`.

## Resources And Prompts

The MCP server exposes resources and prompts in addition to tools.

Resources:

- `resources/list` exposes core docs such as `archetype://docs/consumer-plane`.
- `resources/templates/list` exposes package resource templates for `agent-context/consumer-plane.json`, `review-console/session.json`, `progressive/lazy-contract-index.json`, and `mcp/current-phase-resources.json`.
- `resources/read` reads a declared Archetype resource without broad filesystem scanning.

Prompts:

- `archetype_current_phase`
- `archetype_review_draft`
- `archetype_tests_first_handoff`

Use `prompts/get` with `outputDir` to get a phase-specific prompt backed by the consumer plane and review console.

## Approval Safety

MCP generation follows the same approval gate as the CLI. `archetype_generate_package` emits a draft package until the human review decision is submitted through `archetype_submit_review` or the CLI fallback `archetype review`. `approve` writes the bound proof and canonical package, `request_changes` records feedback and regenerates a draft, and `reject` keeps implementation blocked. A hand-edited `contractApproval` object is reported as unbound and remains implementation-blocked. The proof binds required draft artifacts plus the route, screen, component, token, and frontend-contract fingerprint. Draft package manifests expose `compiler_phases`; canonical, test-first, verification, target, QA, and repair phases stay skipped until bound approval.

When `archetype_generate_package` returns a `draft_contract`, hosts should surface `review-console/index.html`, `draft/design-system-preview.html` for browser review, `draft/design-directions.json` for direction options, `draft/design-quality-gate.json` for anti-generic blockers, `draft/design-craft-rubric.md` for human visual craft review, and `draft/design-system-review.md` for the review loop. The preview is static HTML generated from `draft/design-system.draft.json`; it is not app code and must not be used as implementation authority.

`archetype_verify_target` defaults `skipInstall` to `true` for MCP safety. Pass `skipInstall: false` only when the user or host explicitly allows dependency installation in the target frontend.

`archetype_verify_target` also enforces `test-first/test-quality-standard.json`; target tests that only check generated markers fail before Playwright runs.

When verification runs, `archetype_verify_target` writes per-scenario evidence to `verification/playwright-evidence.json`. Agents should inspect `evidence_grades`, `scenario_results`, `scenario_summary`, and `visual_screenshot_summary` before claiming completion. `runtime_overall: pass` proves the browser contract passed; `manual_reviewed` and `production_integrated` stay pending until external production review closes them.

Use `archetype_release_doctor` before setup demos or plugin install support to verify the package, docs, plugin wrappers, MCP configs, and lifecycle readiness surface.

Use `archetype_plan_repair` after target verification to write `10-revision/repair-task-queue.json` and `10-revision/repair-plan.md` from the latest evidence.
