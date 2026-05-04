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

## Test-First Contracts

Scope reference:

- `archetype-plugin-pivot-md/scopes/14-test-first-contracts.md`
- `archetype-plugin-pivot-md/scopes/10-roadmap-and-acceptance.md`

Lesson:

- Spec-driven development and test-driven implementation are related but not the same. The canonical spec says what must be built; the test-first contract says which tests must exist before code is written.
- The test-first contract must derive from `spec/archetype-spec.json`, not from prose instructions alone, or agents can drift into generic test plans.
- A useful agent harness needs target test file obligations, suite types, evidence gates, and red-first policy in machine-readable form.
- Validation must fail if the test-first layer is missing. Otherwise Archetype can claim TDD in docs while generated packages silently omit the thing agents need.
- Source-generation runbooks must not accidentally put tests after UI files. Even if the compiler generates test obligations correctly, downstream codegen guidance can undermine TDD if its task order is wrong.
- Scope 3 should not turn Archetype into the user's app test runner. It generates deterministic obligations and templates; target execution and Playwright-backed proof are a separate verification scope.

Deviation review:

- No pivot-plan deviation was accepted. The new test-first artifacts extend the generated contract package and plugin workflow without adding hosted web, backend, cloud, account, or billing surfaces.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation

## Playwright-Backed Verification

Scope reference:

- `archetype-plugin-pivot-md/scopes/15-playwright-verification.md`
- `reinforcement-learning/lifecycle-loop-log.md`

Lesson:

- Test-first contracts are not enough to prove an implementation. The harness needs a separate browser verification contract that runs after implementation and writes evidence.
- The Playwright contract must derive from `spec/archetype-spec.json` and `test-first/test-first-contract.json`, or browser checks can drift from the generated source of truth.
- `verify-target` should be the single proof command for agents: install, typecheck, production build, Playwright, audit, target execution report, and evidence writing.
- The generated target must expose `npm run archetype:playwright` so Claude Code and Codex can execute the same deterministic browser checks without knowing internal files.
- A readiness URL cannot assume `/` exists. The generated Playwright config must wait on a declared route.
- Flow scenario generation has to read wrapped canonical structures like `{ flows: [...] }`, not only raw arrays.

Deviation review:

- No pivot-plan deviation was accepted. Scope 4 added local browser proof to the harness and did not reintroduce hosted web, backend, account, billing, cloud test orchestration, or project storage surfaces.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation

## Installability Certainty Audit

Scope reference:

- `archetype-plugin-pivot-md/scopes/02-repo-package-cleanup.md`
- `archetype-plugin-pivot-md/scopes/09-demo-and-examples.md`
- `archetype-plugin-pivot-md/scopes/10-roadmap-and-acceptance.md`

Lesson:

- I could not honestly answer 100% yes while the repo only proved local-source execution. The missing proof was a clean consumer install from the packed npm artifact.
- I also found unused LLM-provider source files that belonged to a previous hosted/product direction. Keeping them would make the codebase look like it still had a provider-backed orchestration layer, which violates the harness pivot.
- Deleting source files was not sufficient because stale compiled files remained in `dist/` and would have shipped in the npm package. The build must clean `dist/` before compiling.
- The fix is `scripts/run-install-contract.mjs`: it packs the package, installs the tarball into a clean consumer directory, runs the installed `archetype` CLI through init/generate/validate/summarize, starts the installed `archetype-mcp` server, exercises the no-clone `npx -p <tarball> archetype` quickstart, verifies plugin files are present, and asserts the loop completes under 60 seconds.
- The fix is now part of `npm run check`, and the pivot audit explicitly fails if deleted provider source files or stale compiled provider files return.

Deviation review:

- No pivot-plan deviation was accepted. I did not run `npm publish`; this phase proves the package artifact that would be published and the local clean install path that users and agents depend on.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation

## Natural-Language Harness Front Door

Scope reference:

- `archetype-plugin-pivot-md/scopes/07-claude-code-plugin.md`
- `archetype-plugin-pivot-md/scopes/08-codex-plugin.md`
- `archetype-plugin-pivot-md/scopes/10-roadmap-and-acceptance.md`

Lesson:

- A CLI-first explanation is still too much product friction. The user should not need to know the internal sequence of blueprint, generate, implement, validate, verify, or which generated file to hand back to Claude Code or Codex.
- The correct harness surface is a single natural-language front door where the user writes intent and imports files with `@` references. The host agent reads those files, asks only missing-context questions, creates the intake, generates the contract, implements, verifies, and revises in one loop.
- Imported `@` files must become first-class source materials, not loose prose. `archetype_create_intake` now accepts a `materials` array so the plugin can preserve imported briefs, screenshots, design files, and repo context as evidence.
- Phase skills remain useful internally, but they are no longer the primary user experience. `archetype` is the front door; blueprint, implement, verify, and revise are subflows.

Deviation review:

- The pivot plan originally listed phase-specific skills but did not explicitly require the natural front door. I updated the pivot scopes and acceptance criteria because the previous shape was technically installable but not intuitive enough for the product goal.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation

## Lifecycle And Context Completion

Scope reference:

- `archetype-plugin-pivot-md/scopes/12-lifecycle-orchestrator.md`
- `reinforcement-learning/lifecycle-loop-log.md`

Lesson:

- `/archetype "project idea"` must imply the lifecycle. The user should not have to say "ask me questions", "ask for materials", "implement", or "verify".
- Clarify is context completion. The generated package now records known facts, missing decisions, assumptions, optional material prompt, focused questions, confidence, current state, and next state.
- Lifecycle artifacts must be generated into every package and validated like route maps, screen inventories, and contracts.
- The lifecycle state machine is the spine for upcoming canonical spec, test-first contract, Playwright verification, and revision scopes.

Deviation review:

- No scope deviation was accepted. Canonical spec files, executable test contracts, and Playwright-backed verification are intentionally next scopes, not hidden inside Scope 1.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation

## Canonical Spec Artifacts

Scope reference:

- `archetype-plugin-pivot-md/scopes/13-canonical-spec-artifacts.md`
- `reinforcement-learning/lifecycle-loop-log.md`

Lesson:

- Archetype cannot claim spec-driven development from scattered route, screen, token, and contract artifacts alone. It needs a named canonical spec.
- `spec/archetype-spec.json` is the machine-readable source of truth and `spec/archetype-spec.md` is the human-readable source of truth.
- Agent instructions, summarize entrypoints, manifests, validation, and contract tests must all point to the canonical spec first.
- Test-first contracts must derive from this spec in the next scope.

Deviation review:

- No scope deviation was accepted. Executable test-contract generation remains next because Scope 2 is only the canonical spec layer.

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

## Phase 7 - Distribution

Scope reference:

- `archetype-plugin-pivot-md/scopes/09-demo-and-examples.md`
- `archetype-plugin-pivot-md/scopes/10-roadmap-and-acceptance.md`
- `archetype-plugin-pivot-md/scopes/11-readme-rewrite.md`

Lesson:

- Distribution is not only package metadata. Users need a published-package path, a local-source path, MCP startup, plugin install notes, a demo script, and release notes.
- Because `dist/` is ignored, the package needs `prepare: npm run build` so git installs and package preparation produce runnable bins.
- `mcp.example.json` should default to the published package command. Local source paths belong in docs, not the default config.
- The demo has to execute the full loop: init, generate, validate, summarize, write target, and verify target. A narration-only demo would not prove the harness works.
- Distribution docs need a contract test because docs and wrapper config can drift without breaking TypeScript.

Deviation review:

- No pivot-plan deviation was accepted. I documented publish-ready commands and local install paths, but did not run `npm publish` because publishing requires registry credentials and an explicit release decision.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation

## Final Pivot Convergence Audit - Root Residue Removal

Scope reference:

- `archetype-plugin-pivot-md/START_HERE.md`
- `archetype-plugin-pivot-md/scopes/01-product-positioning.md`
- `archetype-plugin-pivot-md/scopes/02-repo-package-cleanup.md`
- `archetype-plugin-pivot-md/scopes/10-roadmap-and-acceptance.md`

Lesson:

- I could not honestly answer the user's certainty question while root-level pre-pivot files still existed. Even if they were not shipped in the npm package, they kept a competing product narrative in the repository.
- The wrong files were old web/workbench/productization/onboarding/spec artifacts: `SPEC.md`, `SPEC_CONVERGED.md`, `PRODUCT.md`, `PRODUCT_DEVELOPMENT_PLAN.md`, `PRODUCTIZATION_PLAN.md`, `PRODUCTIZATION_IMPLEMENTATION_LOG.md`, `ONBOARDING_PLAN.md`, `ONBOARDING_IMPLEMENTATION_LOG.md`, `IMPLEMENTATION_STATUS.md`, `DESIGN.md`, `CONVERGENCE_REPORT.md`, and `WORKBENCH_UI_AUDIT.md`.
- Ignored local directories `workbench/` and `dist-workbench/` were also wrong because they made the local tree look like the old product still existed.
- The fix is not just deletion. `scripts/run-pivot-convergence-audit.mjs` now makes this part of `npm run check` by asserting the legacy root files and workbench directories stay gone while required harness files remain present.
- `scripts/` must be included in the package file list because the distributed README and package scripts expose demo and contract commands.

Deviation review:

- No pivot-plan deviation was accepted. The 50-iteration historical logs remain under `iterations/` as requested iteration artifacts, while the misleading root-level product docs were removed from the product surface.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation
