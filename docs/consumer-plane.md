# Agent Consumer Plane

The Agent Consumer Plane is the small natural-language surface between Archetype and a host agent such as Codex or Claude Code.

It is not a webapp. It is the contract that makes `$archetype` and `/archetype` feel like one guided workflow instead of a pile of commands and generated files.

## Purpose

The consumer plane answers four questions:

- What should the host say to the user now?
- What lifecycle action is legal next?
- Which artifacts may the host read now?
- Which artifacts must be deferred to avoid token waste or phase drift?

## Generated Artifact

Every lifecycle package writes:

```txt
agent-context/consumer-plane.json
agent-context/consumer-plane.md
```

The JSON is the machine contract. The markdown is the human-readable mirror.

The CLI fallback is:

```bash
archetype next-action --out archetype-output --json
```

The MCP tool is:

```txt
archetype_consumer_next_action
```

## Review Console

The consumer plane points to the local review cockpit:

```txt
review-console/index.html
review-console/session.json
```

The console shows decisions instead of raw artifact lists:

- current phase
- what Archetype knows
- what is missing
- one active question
- attached materials
- route proposals
- draft design preview
- approval checklist
- blocked reasons
- run timeline
- next legal action

The console is static local HTML generated from package artifacts. It is not a product webapp and it is not implementation authority.

## Read Policy

Agents start with:

```txt
agent-context/consumer-plane.json
agent-context/context-summary.json
agent-context/phase-bundles/index.json
agent-context/phase-bundles/<current-phase>.json
```

Full artifacts are allowed only when the consumer plane and active phase bundle name them.

Broad scans of `archetype-output/` are forbidden unless a verifier needs exact evidence for a named failure.

For a smaller handoff, use:

```bash
archetype phase-package --out archetype-output --phase <phase> --target archetype-phase-package --force --json
```

The phase package copies only the consumer plane, review console, active phase bundle, required reads, MCP descriptors, and orchestration/permission contracts.

## UX Policy

The user should only need natural language:

```txt
$archetype "Build a marketing analytics admin dashboard."
/archetype "Build a marketing analytics admin dashboard."
```

The host agent may call CLI or MCP tools internally, but it must not ask the user to run internal commands, pick generated files, or know the artifact layout.

Clarification is one question at a time. Draft review surfaces the design-system preview and approval request. Implementation starts only after bound human approval, then follows tests first.

## Relationship To Other Planes

The consumer plane is the user and host-agent interface.

The control plane is the phase authority. It decides whether clarify, draft, approve, canonicalize, test, implement, verify, QA, or repair is allowed.

The data plane is the replay substrate. It records run state, events, artifact lineage, projections, verification state, and repair provenance.

The progressive layer is the lazy expansion substrate. It records which artifacts are generated or read now, which are deferred, and the token budget per phase.
