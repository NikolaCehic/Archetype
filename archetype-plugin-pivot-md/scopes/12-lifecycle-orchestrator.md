# Scope 12 — Lifecycle Orchestrator

## Purpose

Make `/archetype "project idea"` mean the complete spec-driven and test-driven lifecycle by default.

The user should not need to say:

```txt
Build this frontend. Ask me what is missing, then implement and verify.
```

That behavior is Archetype.

## Lifecycle

```txt
start
clarifying
waiting_for_optional_materials
intaking
spec_generating
test_generating
implementing_tests_first
verifying_with_playwright
revising
done
```

## Clarify Means Context Completion

Clarify is not a chatty question phase. It is a deterministic context-completion phase:

- extract known facts
- detect missing decisions
- ask only required questions
- invite optional material
- record assumptions
- choose the next lifecycle state

## Generated Artifacts

```txt
archetype-output/lifecycle/state-machine.json
archetype-output/lifecycle/context-completion.json
archetype-output/lifecycle/clarification-questions.json
archetype-output/lifecycle/lifecycle-report.md
```

## Acceptance Criteria

```txt
[ ] `/archetype "project idea"` is documented as the default front door.
[ ] The lifecycle state machine is generated into every package.
[ ] Context completion reports known facts, missing decisions, assumptions, optional material prompt, questions, confidence, and next state.
[ ] Generated AGENTS.md and CLAUDE.md reference lifecycle context before implementation.
[ ] Tests prove rich context can proceed and sparse context asks clarifying questions.
```

## Codex Instruction

Implement this before canonical spec and test-first contract work. The lifecycle state machine is the spine that later scopes must attach to.
