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

## Phase 3 - Generated Agent-Readable Output

Scope reference:

- `archetype-plugin-pivot-md/scopes/05-output-contract.md`
- `archetype-plugin-pivot-md/scopes/10-roadmap-and-acceptance.md`
- `archetype-plugin-pivot-md/prompts/codex-phase-03-output-contract.md`

Lesson:

- The generated package must expose canonical, shallow paths for agents first. Deep numbered internals can remain for audit, but `manifest.json`, `AGENTS.md`, `CLAUDE.md`, `implementation-contract.md`, and CLI summarize/validate must point to `product/`, `experience/`, `screens/`, `design-system/`, `frontend-agent-contract/`, and `validation/`.
- Agent readability is a contract, not just file existence. The implementation contract originally listed no components because it read the older `components` key instead of the canonical `contracts` array; validation has to parse canonical files and the human-readable contract has to summarize them correctly.
- `frontend-agent-contract/implementation-rules.json` is the right canonical merge point for routing, layout, responsive, interaction, data, action, and form rules. This gives Claude Code and Codex one deterministic file to load after the route, screen, and design-system files.
- CLI contract tests need to assert the canonical output shape directly, otherwise the generator can pass with legacy nested artifacts while failing the pivot adoption layer.

Deviation review:

- No pivot-plan deviation was accepted. The numbered source folders remain in generated output as advanced audit material, but every required agent entrypoint and primary artifact path now uses the Phase 3 canonical output contract.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation

## Phase 4 - MCP Server

Scope reference:

- `archetype-plugin-pivot-md/scopes/06-mcp-server.md`
- `archetype-plugin-pivot-md/scopes/10-roadmap-and-acceptance.md`
- `archetype-plugin-pivot-md/prompts/codex-phase-04-mcp.md`

Lesson:

- The MCP surface must stay a tool harness, not a reasoning agent. The server only exposes deterministic wrappers for intake creation, package generation, validation, summarization, artifact reads, and target verification.
- A manual stdio JSON-RPC server is sufficient for this phase when it follows MCP initialization, tool listing, tool calling, newline-delimited messages, and JSON Schema input definitions. This keeps the package dependency-free and avoids pulling SDK/runtime churn into the compiler.
- MCP generation needs stricter path safety than the CLI. A coding agent can accidentally pass `outputDir: "."`; the MCP tool now rejects filesystem roots, the repo cwd, home, and existing project-like directories before calling the exporter.
- Target verification can install dependencies only with explicit permission. The MCP tool defaults `skipInstall` to true and documents that `skipInstall: false` is an intentional host/user permission.
- The MCP contract test has to exercise the actual server over stdio, not imported functions. It now covers initialize, tools/list, unsafe output rejection, intake creation, generation, validation, summarize, read artifact, write-target setup, and verify-target.

Deviation review:

- No pivot-plan deviation was accepted. The MCP implementation lives as a module and package bin in the current single package rather than a separate `packages/mcp` workspace because the Phase 1 package decision kept a single package until splitting adds real distribution value. The plugin templates and docs point to the local `archetype-mcp` bin.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation

## Phase 5 - Claude Code Plugin

Scope reference:

- `archetype-plugin-pivot-md/scopes/07-claude-code-plugin.md`
- `archetype-plugin-pivot-md/scopes/10-roadmap-and-acceptance.md`
- `archetype-plugin-pivot-md/prompts/codex-phase-05-plugins.md`

Lesson:

- The Claude Code plugin should be a wrapper and workflow guide, not a compiler fork. The skills point to MCP tools first and CLI fallback second.
- The plugin needs four separate workflows because blueprint, implement, verify, and revise have different entry criteria and failure modes. Combining them would make Claude blur contract generation with implementation.
- Subagents are useful as written policy roles only when they stay bounded: product architect structures messy context; frontend contract reviewer checks implementability and verification gaps.
- The package must ship plugin wrapper files in `plugins/` so local and published installs can reference the same `.mcp.json`, skills, and agent docs.
- A plugin contract test is necessary because plugin files are mostly markdown and JSON. The test validates manifest shape, MCP command wiring, required skill/tool references, fallback CLI commands, subagent scope, and forbidden product-scope drift.

Deviation review:

- No pivot-plan deviation was accepted. The combined Phase 05 prompt mentions both Claude and Codex plugin wrappers, but the roadmap defines Phase 5 as Claude Code and Phase 6 as Codex. I kept Phase 5 scoped to Claude Code so each phase stays independently testable.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation

## Phase 6 - Codex Plugin

Scope reference:

- `archetype-plugin-pivot-md/scopes/08-codex-plugin.md`
- `archetype-plugin-pivot-md/scopes/10-roadmap-and-acceptance.md`
- `archetype-plugin-pivot-md/prompts/codex-phase-05-plugins.md`

Lesson:

- The Codex plugin should mirror the Claude workflow intent but use Codex-native structure: `.codex-plugin/plugin.json`, compact skills, MCP config, and no subagent layer unless Codex plugin scope adds one.
- The generated `AGENTS.md` path remains important even with a plugin. The implement skill must start from `AGENTS.md` and the implementation contract so Codex can also work without plugin installation.
- MCP-first plus CLI fallback is the right plugin pattern because it keeps the workflow usable in local repos, published package installs, and agent hosts that have not enabled MCP yet.
- The Codex plugin contract test should stay separate from the Claude plugin test because the manifest shape, skill names, and host conventions differ.
- Plugin package inclusion has to be validated by `npm pack --dry-run`; otherwise wrapper files can pass local tests while missing from distribution.

Deviation review:

- No pivot-plan deviation was accepted. Codex plugin work stayed wrapper-only and did not change core compiler, CLI, MCP tools, or generated output behavior.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation
