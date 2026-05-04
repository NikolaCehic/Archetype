# Use Archetype With Codex

Archetype gives Codex an implementation contract before code is written.

## Generate A Contract

```bash
npx . generate --input examples/saas-dashboard-intake.json --out archetype-output --json
```

## Ask Codex To Implement

```txt
Use ./archetype-output to implement the frontend. Follow AGENTS.md, implementation-contract.md, and verification-plan.md. Do not invent routes, screens, states, design tokens, data contracts, or product copy outside the contract.
```

Codex should read `experience/route-map.json`, `screens/screen-inventory.json`, `design-system/tokens.json`, and `frontend-agent-contract/implementation-rules.json` before writing UI code.

## Verify Before Completion

```bash
npx . summarize --out archetype-output --json
npx . validate --out archetype-output --json
npx . verify-target --out archetype-output --target . --json
```

Codex plugin work is tracked in `archetype-plugin-pivot-md/scopes/08-codex-plugin.md`.
