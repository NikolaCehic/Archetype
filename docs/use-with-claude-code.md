# Use Archetype With Claude Code

Archetype gives Claude Code an implementation contract before code is written.

## Generate A Contract

```bash
npx . generate --input examples/saas-dashboard-intake.json --out archetype-output --json
```

## Ask Claude Code To Implement

```txt
Use ./archetype-output to implement the frontend. Follow CLAUDE.md, implementation-contract.md, and verification-plan.md. Do not invent routes, screens, states, design tokens, data contracts, or product copy outside the contract.
```

## Verify Before Completion

```bash
npx . summarize --out archetype-output --json
npx . validate --out archetype-output --json
npx . verify-target --out archetype-output --target . --json
```

Claude Code plugin work is tracked in `archetype-plugin-pivot-md/scopes/07-claude-code-plugin.md`.
