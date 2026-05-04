# Scope 10 — Roadmap And Acceptance Criteria

## Purpose

Define the build sequence and pass/fail gates for the plugin pivot.

This is the execution scoreboard.

## Phase 1 — Product Cleanup

Tasks:

```txt
[ ] Add open-source license.
[ ] Remove private package blocker if publishing.
[ ] Add package exports.
[ ] Add CLI bin entry.
[ ] Add clean README quickstart.
[ ] Add docs/use-with-claude-code.md.
[ ] Add docs/use-with-codex.md.
[ ] Add examples for at least one product category.
```

Pass condition:

```txt
A stranger can run one command and get an Archetype package.
```

## Phase 2 — Stabilize CLI

Tasks:

```txt
[ ] Implement or stabilize archetype init.
[ ] Implement or stabilize archetype generate.
[ ] Implement or stabilize archetype validate.
[ ] Implement or stabilize archetype summarize.
[ ] Implement or stabilize archetype verify-target.
[ ] Add --json mode to relevant commands.
```

Pass condition:

```txt
The CLI is deterministic enough for an agent to call and parse.
```

## Phase 3 — Generate Agent-Readable Output

Tasks:

```txt
[ ] Generate top-level README.md.
[ ] Generate top-level AGENTS.md.
[ ] Generate top-level CLAUDE.md.
[ ] Generate top-level implementation-contract.md.
[ ] Generate top-level verification-plan.md.
[ ] Generate manifest.json with stable artifact IDs.
```

Pass condition:

```txt
Claude Code or Codex can use the generated output without plugin installation.
```

## Phase 4 — MCP Server

Tasks:

```txt
[ ] Create MCP package.
[ ] Add archetype_generate_package.
[ ] Add archetype_validate_package.
[ ] Add archetype_summarize_package.
[ ] Add archetype_read_artifact.
[ ] Add archetype_verify_target.
[ ] Add local startup command.
```

Pass condition:

```txt
An agent host can call Archetype tools without manual shell commands.
```

## Phase 5 — Claude Code Plugin

Tasks:

```txt
[ ] Add Claude plugin manifest.
[ ] Add natural-language archetype front door.
[ ] Add blueprint skill.
[ ] Add implement skill.
[ ] Add verify skill.
[ ] Add revise skill.
[ ] Add product architect subagent.
[ ] Add frontend contract reviewer subagent.
[ ] Add MCP config.
```

Pass condition:

```txt
Claude Code can generate, consume, and verify Archetype contracts through plugin workflows.
```

## Phase 6 — Codex Plugin

Tasks:

```txt
[ ] Add Codex plugin manifest.
[ ] Add natural-language archetype front door.
[ ] Add archetype-blueprint skill.
[ ] Add archetype-implement skill.
[ ] Add archetype-verify skill.
[ ] Add archetype-revise skill.
[ ] Add MCP config.
[ ] Add CLI fallback instructions.
```

Pass condition:

```txt
Codex can use Archetype workflows through skills and generated AGENTS.md.
```

## Phase 7 — Distribution

Tasks:

```txt
[ ] Publish CLI package or document local install.
[ ] Publish MCP package or document local install.
[ ] Document Claude plugin installation.
[ ] Document Codex plugin installation.
[ ] Add demo video/script.
[ ] Add release notes.
```

Pass condition:

```txt
Users can install/use Archetype without cloning and reverse-engineering the repo.
```

## Final Acceptance Criteria

```txt
[ ] `npx @nikolacehic/archetype generate ...` works.
[ ] Claude Code plugin loads locally.
[ ] Claude blueprint skill works.
[ ] Claude implement skill works.
[ ] Claude verify skill works.
[ ] Codex blueprint skill works.
[ ] Codex implement skill works.
[ ] Codex verify skill works.
[ ] Natural-language `@Archetype @file...` flow works without user command choreography.
[ ] MCP server exposes generate/validate/read/verify tools.
[ ] Generated output includes AGENTS.md.
[ ] Generated output includes CLAUDE.md.
[ ] Demo app can be generated, implemented, and verified.
[ ] README shows install/use path in under 10 lines.
[ ] No workbench interaction required for first value.
```

## Codex Instruction

When implementing this roadmap, complete one phase at a time. Do not start plugin work until CLI and output contract are stable enough to call.
