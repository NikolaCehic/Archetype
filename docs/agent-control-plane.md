# Agent Control Plane

Archetype's Agent Control Plane is the deterministic authority that decides what an AI coding host may do next.

It is different from the Agent Data Plane:

- The control plane decides lifecycle permission.
- The data plane records lifecycle evidence, events, artifacts, lineage, and replay data.
- The host agent executes the allowed next step, but it may not override the control plane.

## Why It Exists

The control plane prevents the failure mode where a vague prompt becomes a confident frontend implementation.

It hard-stops when:

- source materials have not been requested or explicitly declined
- required context is weak
- clarification tries to become a bulk form
- routes are inferred but not approved
- canonical output drifts from the approved draft
- approval is not bound to a draft/source/artifact fingerprint
- design-system components lack interaction states
- tests are marker-only or do not prove behavior

## Generated Artifacts

Every draft and canonical package includes:

- `governance/agent-control-plane.json`
- `governance/agent-control-plane.md`

The JSON artifact is machine-readable. The Markdown artifact is the human review surface.

## Required Handoff Order

```txt
material_intake
one_question_clarification
draft_contract
specialist_review
human_approval
canonical_parity
test_first_red_run
implementation
playwright_verification
qa_evidence
repair_until_green
```

## Canonical Parity

`archetype_submit_review` and the CLI fallback `archetype review --decision approve` bind approval to a draft contract fingerprint:

- routes
- screens
- component names
- design token digest
- frontend contract digest

Canonical generation must match that fingerprint before implementation handoff.

## Non-Goals

The control plane does not call an LLM, run an autonomous agent, or replace the data plane. It is a local, typed lifecycle authority for Codex, Claude Code, MCP clients, and CLI users.
