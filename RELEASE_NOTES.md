# Release Notes

## 0.1.0 - Agent Harness Pivot

This release pivots Archetype into an agent harness for Claude Code, Codex, and MCP-capable agent hosts.

### Added

- Public CLI commands: `init`, `generate`, `validate`, `summarize`, `simulate`, `write-target`, and `verify-target`.
- Agent-readable `archetype-output` entrypoints: `AGENTS.md`, `CLAUDE.md`, `implementation-contract.md`, `verification-plan.md`, `readiness-report.md`, and `manifest.json`.
- Canonical spec and test-first output folders for spec-driven plus test-driven agent implementation.
- Canonical output folders for product, experience, screens, design system, frontend-agent contracts, and validation.
- MCP stdio server with deterministic Archetype tools.
- Claude Code plugin wrapper with blueprint, implement, verify, and revise skills.
- Codex plugin wrapper with blueprint, implement, verify, and revise skills.
- Demo runner and distribution documentation.

### Distribution

- Published package command after release:

```bash
npx -y -p @nikolacehic/archetype archetype init --template saas-dashboard --out archetype.intake.json --force --json
npx -y -p @nikolacehic/archetype archetype generate --input archetype.intake.json --out archetype-output --json
```

- Local source path:

```bash
npm install
npm run build
npm run demo:run
```

### Known Warnings

Generated contracts intentionally report warnings for external production confirmations such as backend schema, auth model, final copy, production accessibility review, and target-stack execution proof.
