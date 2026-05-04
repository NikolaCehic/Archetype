# Codex Prompt — Phase 01 Repo Cleanup

Use this prompt inside the Archetype repo.

```txt
Read AGENTS.md and scopes/02-repo-package-cleanup.md.

Implement Phase 1 cleanup only:

1. Make the package installable or clearly document local-only usage.
2. Add/verify a CLI bin entry.
3. Add/verify open-source license metadata.
4. Add example intake files if missing.
5. Add a quickstart that generates archetype-output from an example intake.
6. Do not modify core compiler behavior unless required to make the quickstart work.
7. Do not add cloud features, auth, billing, or workbench-first flows.

After changes, run the relevant build/test/smoke commands and summarize exactly what works and what still fails.
```
