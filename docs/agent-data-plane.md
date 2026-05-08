# Agent Data Plane

Archetype's Agent Data Plane is the deterministic run substrate for the agent harness.

It records what happened during a run, which artifacts were produced, which lifecycle gates were active, what evidence was available, and how a run can be replayed for inspection.

It augments `archetype-output/`. It does not replace the generated contract package.

## Control Plane, Runtime, Data Plane

### Control Plane

The control plane decides what is allowed:

- context sufficiency
- one-question clarification
- draft vs canonical contract state
- human approval before implementation
- test-first before product UI
- Playwright and QA before completion
- repair before completion claims

In Archetype, the control plane is encoded by lifecycle modules, governance artifacts, readiness tiers, validation, CLI commands, and MCP tools.

### Runtime

The runtime executes work:

- Codex skill/plugin workflow
- Claude Code command/skill workflow
- local CLI commands
- MCP tool calls
- target frontend test and verification commands

The runtime may call Archetype tools, but it must not invent lifecycle state.

### Data Plane

The data plane stores inspectable run facts:

- run and session records
- append-only events
- artifact records and hashes
- lifecycle, evidence, contract, verification, and readiness projections
- replay output

The data plane is local-first, file-backed, deterministic, and queryable by humans and agents.

## Local Layout

Each generated package can include:

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

The run directory is intentionally plain JSON and JSONL so users and agents can inspect it without a database.

## Lifecycle Mapping

| Lifecycle stage | Data-plane record |
| --- | --- |
| idea or intake | run created, intake event |
| clarification | lifecycle gate event, lifecycle projection |
| evidence | evidence event, evidence projection |
| draft contract | contract event, artifact records for draft outputs |
| human approval | decision event, contract projection |
| canonical spec | contract event, canonical artifact records |
| test-first contracts | contract and verification events |
| implementation | task events from downstream agents |
| Playwright verification | verification event and projection |
| QA | evidence and verification events |
| repair or revision | repair events, task records |

## Canonical Entities

- `AgentRun`: one Archetype generation or verification run.
- `AgentSession`: optional host-agent session metadata.
- `DataPlaneEvent`: append-only event record with sequence and timestamp.
- `ArtifactRecord`: stable metadata for a generated or referenced artifact.
- `ArtifactRef`: lightweight pointer to an artifact record.
- `ContractVersion`: versioned contract snapshot reference.
- `LifecycleSnapshot`: lifecycle gate state for the run.
- `EvidenceRecord`: source or verification evidence fact.
- `DecisionRecord`: confirmed, candidate, missing, conflicted, or blocked decision.
- `TaskRecord`: implementation, QA, or repair task.
- `RepairRecord`: repair provenance and status.
- `VerificationRecord`: target verification proof.
- `DataPlaneProjection`: materialized read model built from events.

## Event Model

Events are append-only and ordered by sequence within a run.

Examples:

- `run.created`
- `intake.recorded`
- `evidence.recorded`
- `lifecycle.gate_evaluated`
- `contract.draft_recorded`
- `contract.canonical_recorded`
- `artifact.recorded`
- `verification.recorded`
- `qa.recorded`
- `repair.recorded`
- `projection.updated`

Replay reads `events.jsonl` in append order and reconstructs projections.

## Artifact Model

The data plane records artifact metadata, not a second copy of every artifact.

An artifact record includes:

- artifact id
- package-relative path
- artifact type
- source phase
- byte size
- SHA-256 hash
- producer
- lineage event ids
- creation timestamp

Agents should use artifact records to decide what to read, then read generated artifacts only when needed.

## Projection And Query Model

Projections are deterministic read models:

- `lifecycle`: current lifecycle state and gates.
- `evidence`: source and evidence summary.
- `contracts`: draft/canonical/test/verification contract refs.
- `verification`: verification and repair status.
- `readiness`: readiness tier, blockers, warnings, and authorization.

CLI query commands read these projections without calling an LLM:

```bash
archetype data-plane status --out archetype-output --json
archetype data-plane timeline --out archetype-output --run <run-id> --json
archetype data-plane timeline --out archetype-output --run <run-id> --phase qa --type qa.recorded --json
archetype data-plane artifacts --out archetype-output --run <run-id> --priority hot --limit 10 --json
archetype data-plane read-artifact --out archetype-output --artifact <artifact-id> --json
archetype data-plane lifecycle --out archetype-output --run <run-id> --json
archetype data-plane replay --out archetype-output --run <run-id> --json
```

MCP query tools expose the same read-only behavior for agent hosts:

- `archetype_data_plane_status`
- `archetype_data_plane_timeline`
- `archetype_data_plane_artifacts`
- `archetype_data_plane_read_artifact`
- `archetype_data_plane_lifecycle`
- `archetype_data_plane_replay_run`

Projection files are replay-consistent: persisted projection checksums and event counts are verified against replay output. Artifact lookup without a run id fails with a typed ambiguity error if multiple runs contain the same artifact id. Corrupt JSON/JSONL and non-contiguous event sequences are reported as typed data-plane failures.

The dedicated contracts are:

```bash
npm run data-plane:contract
npm run data-plane-authority:contract
```

## Adapter Strategy

The first implementation uses two adapters:

- File adapter for real package runs.
- Memory adapter for tests.

Both adapters implement the same ports so future storage backends can be added without changing CLI/MCP behavior.

## Non-Goals

- No vector memory.
- No database by default.
- No autonomous agent orchestration.
- No hidden global state.
- No replacement of `archetype-output` artifacts.
- No weakening of lifecycle gates.
