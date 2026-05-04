import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type CheckStatus = "pass" | "warning" | "fail";
type ReleaseStatus = "pass" | "warning" | "fail";

interface ReleaseCheck {
  id: string;
  label: string;
  status: CheckStatus;
  details: string;
  paths?: string[];
}

interface PackageJson {
  name?: string;
  version?: string;
  license?: string;
  bin?: Record<string, string>;
  files?: string[];
  scripts?: Record<string, string>;
}

export interface ReleaseDoctorReport {
  report_version: string;
  status: ReleaseStatus;
  generated_at: string;
  package_root: string;
  package_name: string;
  package_version: string;
  package_mode: "source_or_repo" | "installed_package";
  checks: ReleaseCheck[];
  blockers: string[];
  warnings: string[];
  quickstart: {
    published_package: string[];
    local_source: string[];
    target_verification: string[];
  };
  plugin_setup: {
    claude_code: {
      front_door: string;
      plugin_path: string;
      mcp_command: string;
    };
    codex: {
      front_door: string;
      plugin_path: string;
      mcp_command: string;
    };
  };
  lifecycle: string[];
  docs: Array<{ label: string; path: string }>;
  mcp_tools: string[];
  completion_gate: string;
}

function readJsonSafe<T>(filePath: string, fallback: T): T {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function readTextSafe(filePath: string): string {
  if (!existsSync(filePath)) return "";
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function check(
  checks: ReleaseCheck[],
  id: string,
  label: string,
  condition: boolean,
  passDetails: string,
  failDetails: string,
  paths?: string[]
): void {
  checks.push({
    id,
    label,
    status: condition ? "pass" : "fail",
    details: condition ? passDetails : failDetails,
    ...(paths ? { paths } : {})
  });
}

function checkTextIncludes(
  checks: ReleaseCheck[],
  id: string,
  label: string,
  filePath: string,
  expected: string[]
): void {
  const text = readTextSafe(filePath);
  const missing = expected.filter((item) => !text.includes(item));
  checks.push({
    id,
    label,
    status: missing.length === 0 ? "pass" : "fail",
    details: missing.length === 0
      ? `${path.basename(filePath)} contains the required setup language.`
      : `${path.basename(filePath)} is missing: ${missing.join(", ")}`,
    paths: [filePath]
  });
}

function checkMcpConfig(checks: ReleaseCheck[], root: string, relativePath: string): void {
  const filePath = path.join(root, relativePath);
  const config = readJsonSafe<{ mcpServers?: { archetype?: { command?: string; args?: string[] } } }>(filePath, {});
  const args = config.mcpServers?.archetype?.args ?? [];
  check(
    checks,
    `mcp_config.${relativePath}`,
    `${relativePath} launches archetype-mcp`,
    args.includes("archetype-mcp"),
    `${relativePath} points agent hosts at the packaged MCP server.`,
    `${relativePath} must include archetype-mcp in mcpServers.archetype.args.`,
    [filePath]
  );
}

export function runReleaseDoctor(packageRoot: string): ReleaseDoctorReport {
  const root = path.resolve(packageRoot);
  const pkgPath = path.join(root, "package.json");
  const pkg = readJsonSafe<PackageJson>(pkgPath, {});
  const checks: ReleaseCheck[] = [];

  check(
    checks,
    "package.name",
    "Package name",
    pkg.name === "@nikolacehic/archetype",
    "Package name is publish-ready.",
    "package.json must be named @nikolacehic/archetype.",
    [pkgPath]
  );
  check(
    checks,
    "package.license",
    "License",
    pkg.license === "MIT",
    "MIT license is declared.",
    "package.json must declare the MIT license.",
    [pkgPath]
  );
  check(
    checks,
    "package.bins",
    "CLI and MCP bins",
    pkg.bin?.archetype === "./dist/cli.js" && pkg.bin?.["archetype-mcp"] === "./dist/mcp/server.js",
    "Package exposes archetype and archetype-mcp bins.",
    "package.json must expose archetype and archetype-mcp bins.",
    [pkgPath]
  );

  const requiredFiles = [
    "dist",
    "examples",
    "docs",
    ".codex-plugin",
    ".claude-plugin",
    ".agents",
    ".mcp.json",
    "skills",
    "agents",
    "plugins",
    "scripts",
    "README.md",
    "LICENSE"
  ];
  const files = pkg.files ?? [];
  check(
    checks,
    "package.files",
    "Published file allowlist",
    requiredFiles.every((item) => files.includes(item)),
    "Package file allowlist includes dist, docs, examples, root plugin surfaces, plugins, scripts, README, and LICENSE.",
    `package.json files must include: ${requiredFiles.join(", ")}.`,
    [pkgPath]
  );

  const requiredPaths = [
    "dist/cli.js",
    "dist/mcp/server.js",
    "README.md",
    "docs/install.md",
    "docs/quickstart.md",
    "docs/agent-lifecycle.md",
    "docs/release-readiness.md",
    "docs/install-claude-code-plugin.md",
    "docs/install-codex-plugin.md",
    "docs/use-with-mcp.md",
    ".codex-plugin/plugin.json",
    ".claude-plugin/plugin.json",
    ".claude-plugin/marketplace.json",
    ".agents/plugins/marketplace.json",
    ".mcp.json",
    "skills/archetype/SKILL.md",
    "skills/blueprint/SKILL.md",
    "skills/implement/SKILL.md",
    "skills/verify/SKILL.md",
    "skills/revise/SKILL.md",
    "agents/product-architect.md",
    "agents/frontend-contract-reviewer.md",
    "plugins/claude-code/.claude-plugin/plugin.json",
    "plugins/claude-code/.mcp.json",
    "plugins/claude-code/skills/archetype/SKILL.md",
    "plugins/codex/.codex-plugin/plugin.json",
    "plugins/codex/.mcp.json",
    "plugins/codex/skills/archetype/SKILL.md",
    "examples/saas-dashboard-intake.json",
    "scripts/run-install-contract.mjs",
    "scripts/run-plugin-install-contract.mjs",
    "scripts/run-repository-audit.mjs",
    "scripts/run-release-readiness-contract.mjs"
  ];
  const missingPaths = requiredPaths.filter((relativePath) => !existsSync(path.join(root, relativePath)));
  check(
    checks,
    "release.required_paths",
    "Release-critical files",
    missingPaths.length === 0,
    "All release-critical CLI, MCP, plugin, docs, example, and contract files exist.",
    `Missing release-critical files: ${missingPaths.join(", ")}`,
    requiredPaths.map((relativePath) => path.join(root, relativePath))
  );

  checkTextIncludes(checks, "docs.readme", "README setup path", path.join(root, "README.md"), [
    "archetype doctor --json",
    "docs/quickstart.md",
    "docs/agent-lifecycle.md",
    "docs/release-readiness.md",
    "archetype install --target all --json",
    "$archetype \"I want to build a premium B2B analytics app for marketing teams.\""
  ]);
  checkTextIncludes(checks, "docs.quickstart", "Quickstart docs", path.join(root, "docs", "quickstart.md"), [
    "60 seconds",
    "archetype install --target all --json",
    "archetype doctor --json",
    "archetype generate",
    "archetype-output"
  ]);
  checkTextIncludes(checks, "docs.lifecycle", "Agent lifecycle docs", path.join(root, "docs", "agent-lifecycle.md"), [
    "clarify",
    "optional materials",
    "canonical spec",
    "tests first",
    "Playwright",
    "repair"
  ]);
  checkTextIncludes(checks, "docs.release_readiness", "Release readiness docs", path.join(root, "docs", "release-readiness.md"), [
    "archetype doctor",
    "npm run release:contract",
    "npm run plugin-install:contract",
    "npm run repo:audit",
    "npm run install:contract",
    "npm pack --dry-run --json"
  ]);

  checkMcpConfig(checks, root, ".mcp.json");
  checkMcpConfig(checks, root, "mcp.example.json");
  checkMcpConfig(checks, root, "plugins/claude-code/.mcp.json");
  checkMcpConfig(checks, root, "plugins/codex/.mcp.json");

  const blockers = checks.filter((item) => item.status === "fail").map((item) => `${item.label}: ${item.details}`);
  const warnings = checks.filter((item) => item.status === "warning").map((item) => `${item.label}: ${item.details}`);
  const status: ReleaseStatus = blockers.length > 0 ? "fail" : warnings.length > 0 ? "warning" : "pass";

  return {
    report_version: "1.0",
    status,
    generated_at: new Date().toISOString(),
    package_root: root,
    package_name: pkg.name ?? "unknown",
    package_version: pkg.version ?? "unknown",
    package_mode: existsSync(path.join(root, "src")) ? "source_or_repo" : "installed_package",
    checks,
    blockers,
    warnings,
    quickstart: {
      published_package: [
        "npx --yes --package github:NikolaCehic/Archetype archetype install --target all --json",
        "$archetype \"I want to build a premium B2B analytics app for marketing teams.\"",
        "/archetype \"I want to build a premium B2B analytics app for marketing teams.\""
      ],
      local_source: [
        "npm install",
        "npm run build",
        "npx . doctor --json"
      ],
      target_verification: [
        "npx . write-target --out archetype-output --target tmp/generated-frontend --force --json",
        "npx . verify-target --out archetype-output --target tmp/generated-frontend --json",
        "npx . repair --out archetype-output --target tmp/generated-frontend --json"
      ]
    },
    plugin_setup: {
      claude_code: {
        front_door: "/archetype \"I want to build a premium B2B analytics app for marketing teams.\"",
        plugin_path: "~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/",
        mcp_command: "npx --yes --package github:NikolaCehic/Archetype archetype-mcp"
      },
      codex: {
        front_door: "$archetype \"I want to build a premium B2B analytics app for marketing teams.\"",
        plugin_path: "~/.codex/skills/archetype/",
        mcp_command: "npx --yes --package github:NikolaCehic/Archetype archetype-mcp"
      }
    },
    lifecycle: [
      "Natural-language idea",
      "Clarify missing context",
      "Ask for optional materials",
      "Create intake",
      "Generate canonical spec and contract package",
      "Create tests first",
      "Implement from the contract",
      "Verify with Playwright evidence",
      "Plan repairs from failed evidence",
      "Patch or revise until verification passes"
    ],
    docs: [
      { label: "60-second quickstart", path: "docs/quickstart.md" },
      { label: "Install", path: "docs/install.md" },
      { label: "Agent lifecycle", path: "docs/agent-lifecycle.md" },
      { label: "Release readiness", path: "docs/release-readiness.md" },
      { label: "Claude Code plugin", path: "docs/install-claude-code-plugin.md" },
      { label: "Codex plugin", path: "docs/install-codex-plugin.md" },
      { label: "MCP", path: "docs/use-with-mcp.md" }
    ],
    mcp_tools: [
      "archetype_release_doctor",
      "archetype_create_intake",
      "archetype_generate_package",
      "archetype_validate_package",
      "archetype_summarize_package",
      "archetype_read_artifact",
      "archetype_verify_target",
      "archetype_plan_repair"
    ],
    completion_gate: "Release readiness is pass only when doctor, release:contract, plugin-install:contract, repo:audit, install:contract, npm pack dry-run, and full check pass."
  };
}
