# Install Archetype

Archetype is a CLI, MCP server, and installable plugin package for AI coding agents.

## One-Command Agent Install

Install Archetype into Codex and Claude Code:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target all --json
```

This registers the Codex home-local marketplace and a Claude Code local marketplace, then copies the root plugin surface into the locations those hosts can discover.

Use one host at a time when needed:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target codex --json
npx --yes --package github:NikolaCehic/Archetype archetype install --target claude --json
```

After install, start a fresh Codex or Claude Code session:

```txt
@Archetype "I want to build a premium B2B analytics app for marketing teams."
/archetype "I want to build a premium B2B analytics app for marketing teams."
```

## CLI Fallback

Generate a demo contract without cloning the repo:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype doctor --json
npx --yes --package github:NikolaCehic/Archetype archetype init --template saas-dashboard --out archetype.intake.json --force --json
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.intake.json --out archetype-output --json
npx --yes --package github:NikolaCehic/Archetype archetype validate --out archetype-output --json
```

Start the MCP server from the package:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype-mcp
```

## Local Source Install

Use this path before publishing or when testing a branch:

```bash
git clone https://github.com/NikolaCehic/Archetype.git
cd Archetype
npm install
npm run build
npx . install --target all --json
npx . doctor --json
npx . init --template saas-dashboard --out archetype.intake.json --force --json
npx . generate --input archetype.intake.json --out archetype-output --json
```

## Verify

Prove the clean packaged install path, installed CLI, installed MCP server, plugin files, plugin host installer, and 60-second setup contract:

```bash
npm run plugin-install:contract
npm run install:contract
npm run release:contract
```

```bash
npx . validate --out archetype-output --json
npx . summarize --out archetype-output --json
```

For a generated target frontend:

```bash
npx . write-target --out archetype-output --target tmp/generated-frontend --force --json
npx . verify-target --out archetype-output --target tmp/generated-frontend --json
npx . repair --out archetype-output --target tmp/generated-frontend --json
```
