# Demo Script

## Thesis

Brief -> Archetype contract -> coding agent implementation -> verification -> repair tasks when needed.

The coding agent no longer has to guess the frontend architecture.

## Setup

```bash
npm install
npm run build
npx . doctor --json
```

## Run The Demo

```bash
npm run demo:run
```

The demo writes:

- `tmp/demo/archetype.intake.json`
- `tmp/demo/archetype-output/`
- `tmp/demo/generated-frontend/`
- `tmp/demo/demo-summary.json`

## Narration

1. Start from the SaaS dashboard brief.
2. Show `archetype doctor --json` as the setup proof.
3. Generate `archetype-output`.
4. Show `implementation-contract.md`, `experience/route-map.json`, `screens/screen-inventory.json`, and `design-system/tokens.json`.
5. Materialize the target frontend scaffold.
6. Run verification against the generated contract.
7. Show `10-revision/repair-task-queue.json` and explain that failures become concrete patch or revise tasks.
8. Explain warnings as production integration gaps, not compiler failure.

## Agent Prompt

For Codex:

```txt
Use ./archetype-output to implement the frontend. Follow AGENTS.md and implementation-contract.md. Do not invent routes, states, tokens, or product copy outside the contract. If verification fails, patch tasks from 10-revision/repair-task-queue.json first.
```

For Claude Code:

```txt
Use ./archetype-output to implement the frontend. Follow CLAUDE.md and implementation-contract.md. Run verification before declaring completion. If verification fails, patch tasks from 10-revision/repair-task-queue.json first.
```
