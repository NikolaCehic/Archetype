# Archetype Quickstart

Goal: prove Archetype is installed and generate a contract package in about 60 seconds.

## Published Package

```bash
npx -y -p @nikolacehic/archetype archetype doctor --json
npx -y -p @nikolacehic/archetype archetype init --template saas-dashboard --out archetype.intake.json --force --json
npx -y -p @nikolacehic/archetype archetype generate --input archetype.intake.json --out archetype-output --json
```

Read first:

```txt
archetype-output/AGENTS.md
archetype-output/CLAUDE.md
archetype-output/spec/archetype-spec.md
archetype-output/test-first/test-first-plan.md
```

## Local Source

```bash
npm install
npm run build
npx . doctor --json
npx . init --template saas-dashboard --out archetype.intake.json --force --json
npx . generate --input archetype.intake.json --out archetype-output --json
```

## Natural Front Doors

```txt
/archetype "I want to build a premium B2B analytics app for marketing teams."
@Archetype "I want to build a premium B2B analytics app for marketing teams."
```

The plugin flow should clarify missing context, ask for optional materials, generate `archetype-output`, drive tests first, verify with Playwright, and plan repair tasks without making the user learn internal commands.
