# Agent Data Plane Plan

## Purpose

Implement a deterministic local Agent Data Plane for Archetype so Codex, Claude Code, MCP hosts, and verification tools can inspect, replay, and query run state without treating the generated artifact package itself as hidden workflow memory.

The data plane augments generated artifacts. It does not replace existing package paths and does not turn Archetype into an autonomous agent.

## Source Context

- `obsidian-vault/00 Maps/HARDENED_ARCHETYPE_LIFECYCLE Node.md`
- `obsidian-vault/01 Lifecycle/Lifecycle State Machine.md`
- `obsidian-vault/01 Lifecycle/Context Sufficiency Gate.md`
- `obsidian-vault/02 Enforcement/Draft Package.md`
- `obsidian-vault/02 Enforcement/Canonical Package.md`
- `obsidian-vault/04 QA/Test Quality Standard.md`
- `obsidian-vault/04 QA/QA Team.md`
- `obsidian-vault/13 Quality Reviews/Archetype Multiagent Quality Review - 2026-05-07.md`

## Prompt Critique

### Strengths

- Correctly names the feature as an Agent Data Plane.
- Keeps the first implementation local, deterministic, inspectable, and replayable.
- Defines ports/adapters instead of binding the product to a database.
- Requires CLI and MCP query surfaces so humans and agents can use the same substrate.
- Preserves the existing artifact package and lifecycle gates.

### Weaknesses Found

- "Read the entire repository" is too broad for implementation. The practical requirement is a repo map plus exact critical-file reads before each phase.
- The compiler currently returns an in-memory package while exporters write files. The data plane must therefore have two integration points: compiler events before export and artifact records after export.
- The requested projection layout omitted `projections/readiness.json` even though the prompt requires readiness projection behavior.
- `read-artifact` must read data-plane `ArtifactRecord`s by default, not dump large generated artifact contents.
- CLI/MCP generation should write the data plane by default, while direct `runArchetypeCompiler(input)` should remain unchanged unless a data plane is passed.

### Converged Interpretation

Archetype should have a local append-only run substrate:

```txt
archetype-output/data-plane/runs/<run-id>/
  run.json
  events.jsonl
  artifacts/<artifact-id>.json
  projections/lifecycle.json
  projections/evidence.json
  projections/contracts.json
  projections/verification.json
  projections/readiness.json
```

The data plane records lifecycle facts and generated artifact lineage. Existing artifacts remain the implementation contract. The data plane is the deterministic query/replay surface around those artifacts.

## Architecture

### Control Plane

The control plane decides what may happen:

- context gate
- draft vs canonical gate
- approval gate
- test-first gate
- verification and repair gate

Current source: lifecycle modules, governance artifacts, CLI/MCP command flow.

### Runtime

The runtime is the host-agent execution environment:

- Codex skill/plugin invocation
- Claude Code slash command/plugin invocation
- MCP tool execution
- local CLI commands
- target frontend verification commands

The runtime may call tools, but it must not invent lifecycle state.

### Data Plane

The data plane stores and serves deterministic run data:

- run/session identity
- append-only events
- artifact records and lineage
- lifecycle/evidence/contract/verification/readiness projections
- replay output

It is not a memory system, vector database, queue, or autonomous planner.

## Phases

### Phase 01 - Plan And Documentation

Requirements:

- Create this plan.
- Create `docs/agent-data-plane.md`.
- Update README and lifecycle/MCP/Codex docs to describe the data plane.
- Log lessons and source cross-checks.

Acceptance:

- Docs distinguish control plane, runtime, and data plane.
- Docs state the data plane is local, deterministic, file-backed, and non-autonomous.

### Phase 02 - Typed Core And Adapters

Requirements:

- Add `src/data-plane/`.
- Define strict entity and port types.
- Implement memory and file-backed adapters.
- Implement deterministic JSON/JSONL helpers.
- Implement typed errors.

Acceptance:

- No `any` in new files.
- File adapter creates the required layout.
- Memory adapter passes the same behavior contract.
- Missing runs/artifacts/projections return typed errors.

### Phase 03 - Compiler And Exporter Integration

Requirements:

- Add optional `dataPlane` to compiler options.
- Direct compiler calls remain unchanged when no data plane is passed.
- CLI/MCP generate paths create a file-backed data plane by default.
- Compiler records source, evidence, lifecycle, contract, and readiness events.
- Exporters record generated artifact records after files exist.

Acceptance:

- Existing generated artifact paths remain unchanged.
- Clarification, draft, and canonical packages each produce a data-plane run.
- Artifact records include path, type, bytes, SHA-256, source phase, and lineage.

### Phase 04 - CLI Query Surface

Requirements:

- Add:
  - `archetype data-plane status --out archetype-output --json`
  - `archetype data-plane timeline --out archetype-output --run <run-id> --json`
  - `archetype data-plane artifacts --out archetype-output --run <run-id> --json`
  - `archetype data-plane read-artifact --out archetype-output --artifact <artifact-id> --json`
  - `archetype data-plane replay --out archetype-output --run <run-id> --json`

Acceptance:

- Commands are deterministic read/query commands.
- Commands never call an LLM.
- Malformed reads return typed JSON failures, not generic crashes.

### Phase 05 - MCP Query Surface

Requirements:

- Add:
  - `archetype_data_plane_status`
  - `archetype_data_plane_timeline`
  - `archetype_data_plane_read_artifact`
  - `archetype_data_plane_replay_run`

Acceptance:

- MCP tools match CLI read/query semantics.
- MCP tool list includes the new tools.
- Existing MCP tools still work.

### Phase 06 - Contract Tests And Hardening

Requirements:

- Add `scripts/run-data-plane-contract.mjs`.
- Add `data-plane:contract` script.
- Cover creation, ordered events, artifact write/read, replay, CLI, MCP, generation integration, and malformed reads.
- Run `npm run build`, `npm run data-plane:contract`, and targeted existing contracts.

Acceptance:

- `npm run data-plane:contract` passes.
- Existing CLI/MCP contracts still pass.
- Lessons log records mismatches, repairs, and convergence state.

## Hard Loop Rules

For each phase:

1. Read this phase and the relevant Obsidian source nodes.
2. Extract requirements and acceptance criteria.
3. Critique the phase plan.
4. Form the optimal phase plan.
5. Implement only that phase.
6. Test extensively for happy paths and malformed/edge paths.
7. Repair from test results.
8. Re-test repaired implementation.
9. Log mistakes and drifts in `obsidian-vault/12 Scope Implementation Lessons/lessons.md`.
10. Commit and push using `Phase-0x-<phase-name>`.
11. Continue without waiting for a review prompt.

## Non-Goals

- No Postgres, SQLite, vector DB, Redis, or runtime dependency by default.
- No autonomous agent loop.
- No vague "memory" abstraction.
- No replacement of generated artifacts.
- No removal of existing CLI/MCP commands.
- No hidden global state.

## Open Risks

- Exporters currently duplicate artifact path knowledge. Phase 03 should record exported artifacts without pretending to solve the full artifact-registry problem.
- Approval spoofing remains a separate hardening concern unless implemented in a later approval-bound phase.
- Full `npm run check` is expensive. Phase 06 must at least run the data-plane contract and the existing CLI/MCP contracts; full check should run if time and disk budget allow.
