# Scope 01 — Product Positioning

## Purpose

Define the exact product category, message, and strategic lane for the Archetype pivot.

This file should guide README copy, plugin descriptions, marketplace copy, CLI help text, and demo narration.

## Final Positioning

```txt
Archetype is a frontend architecture compiler that turns product intent into implementation-ready contracts for AI coding agents.
```

Shorter:

```txt
Frontend implementation contracts for AI coding agents.
```

Stronger marketing line:

```txt
Stop asking coding agents to guess your product architecture. Give them an Archetype contract.
```

## Product Thesis

Coding agents are good at writing code but unreliable when forced to infer product architecture from vague prompts.

Archetype solves the missing layer between product idea and frontend implementation:

```txt
messy intent → structured contract → agent implementation → verification
```

## What Archetype Is

Archetype is:

- a product-to-frontend contract compiler
- a plugin workflow for Claude Code and Codex
- a deterministic spec generator for coding agents
- a readiness and verification layer for frontend implementation
- a way to reduce hallucinated routes, screens, components, and states

## What Archetype Is Not

Archetype is not:

- a generic chatbot
- a Figma clone
- a random prompt pack
- a full autonomous software engineer
- a universal app generator
- a design inspiration website
- a no-code builder
- a “one prompt builds everything” gimmick

## Primary User

The first user is a developer using Claude Code, Codex, Cursor, or another coding agent who wants better frontend output from ambiguous product ideas.

Secondary users:

- founders prototyping products
- frontend leads creating implementation contracts
- agencies standardizing frontend delivery
- product engineers turning briefs into build plans

## Core Value Proposition

Before Archetype:

```txt
User asks coding agent to build app.
Agent guesses routes, screens, visual system, states, copy, and acceptance criteria.
Output is inconsistent.
```

After Archetype:

```txt
User generates an Archetype contract.
Coding agent implements from explicit routes, screens, states, tokens, components, data contracts, and verification rules.
Output is more consistent and auditable.
```

## Product Promise

Archetype should make coding agents:

- guess less
- implement faster
- preserve product intent
- cover more UI states
- follow design-system constraints
- produce frontend work that can be verified against a contract

## Core Product Sentence

Use this everywhere:

```txt
Archetype turns product briefs, screenshots, brand notes, and existing app context into frontend implementation contracts that Claude Code and Codex can follow.
```

## Terms To Use

Use these terms:

- implementation contract
- frontend agent contract
- product intent
- route map
- screen inventory
- screen states
- design-system tokens
- acceptance criteria
- verification plan
- readiness report

## Terms To Avoid

Avoid these unless extremely specific:

- autonomous AI agent
- AI designer
- full product builder
- universal app generator
- magic frontend generator
- design-to-code platform

## Acceptance Criteria

```txt
[ ] README uses the new category clearly.
[ ] Plugin manifests use the new positioning.
[ ] CLI help text uses contract language.
[ ] No main product copy claims Archetype is a generic autonomous agent.
[ ] Demo proves reduced guessing, not generic AI magic.
```

## Codex Instruction

When implementing this scope, update product copy only. Do not change compiler behavior, CLI internals, MCP, or plugin code unless the copy depends on generated metadata.
