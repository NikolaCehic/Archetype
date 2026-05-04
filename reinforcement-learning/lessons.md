# Pivot Reinforcement Lessons

## Phase 1 - Product Cleanup

Scope reference:

- `archetype-plugin-pivot-md/scopes/01-product-positioning.md`
- `archetype-plugin-pivot-md/scopes/02-repo-package-cleanup.md`
- `archetype-plugin-pivot-md/scopes/10-roadmap-and-acceptance.md`
- `archetype-plugin-pivot-md/scopes/11-readme-rewrite.md`

Lesson:

- The repo had to stop presenting the browser workbench and hosted productization shell as the product. The retained value is the compiler, CLI, generated contract package, examples, and docs for Claude Code/Codex usage.
- The generated package must expose top-level `AGENTS.md`, `CLAUDE.md`, `implementation-contract.md`, `verification-plan.md`, `readiness-report.md`, and `manifest.json`; otherwise the harness still forces agents to reverse-engineer nested internals.
- Domain detection cannot treat the generic word "route" as logistics evidence. The SaaS demo must generate SaaS routes, not logistics screens.
- Marketplace patterns must map to concrete screens or DSAG readiness fails. Examples are only useful when golden generation proves they are ready.
- Stale build output can accidentally ship removed scopes. After deleting a module, clean `dist` before packaging validation.

Deviation review:

- No pivot-plan deviation was accepted. I did not split into `packages/` during this phase because `scopes/02-repo-package-cleanup.md` explicitly allows a clean single package for the first release when a monorepo split would slow the MVP.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation

## Phase 2 - CLI Contract

Scope reference:

- `archetype-plugin-pivot-md/scopes/04-cli-contract.md`
- `archetype-plugin-pivot-md/scopes/10-roadmap-and-acceptance.md`
- `archetype-plugin-pivot-md/prompts/codex-phase-02-cli.md`

Lesson:

- The CLI is the lowest-friction agent harness surface, so every command that agents will call must have stable flags and parseable output.
- `generate` cannot only print prose because MCP and coding agents need readiness, blockers, warnings, and artifact paths as JSON.
- `summarize` is necessary because Codex and Claude should not need to ingest the full contract package before deciding what to read next.
- `init` must be deterministic and template-based, not interactive.
- `validate` must explicitly check top-level agent entrypoints and parse core route/screen artifacts, not only trust internal manifests.

Deviation review:

- No pivot-plan deviation was accepted. I did not add plugin or MCP behavior in this phase because Phase 2 only stabilizes the CLI command surface.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation
