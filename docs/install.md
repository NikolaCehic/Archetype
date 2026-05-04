# Install Archetype

Archetype is a CLI, MCP server, and plugin wrapper package for AI coding agents.

## Published Package

After the package is published, generate a demo contract without cloning the repo:

```bash
npx -y -p @nikolacehic/archetype archetype init --template saas-dashboard --out archetype.intake.json --force --json
npx -y -p @nikolacehic/archetype archetype generate --input archetype.intake.json --out archetype-output --json
npx -y -p @nikolacehic/archetype archetype validate --out archetype-output --json
```

Start the MCP server from the package:

```bash
npx -y -p @nikolacehic/archetype archetype-mcp
```

## Local Source Install

Use this path before publishing or when testing a branch:

```bash
git clone https://github.com/NikolaCehic/Archetype.git
cd Archetype
npm install
npm run build
npx . init --template saas-dashboard --out archetype.intake.json --force --json
npx . generate --input archetype.intake.json --out archetype-output --json
```

## Verify

Prove the clean packaged install path, installed CLI, installed MCP server, plugin files, and 60-second setup contract:

```bash
npm run install:contract
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
