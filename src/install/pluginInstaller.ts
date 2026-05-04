import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export type InstallTarget = "codex" | "claude" | "all";
type ConcreteTarget = Exclude<InstallTarget, "all">;
type InstallStatus = "pass" | "warning" | "fail";
type ActionStatus = "planned" | "written" | "updated" | "skipped" | "failed";

interface InstallAction {
  target: ConcreteTarget;
  operation: string;
  source?: string;
  destination: string;
  status: ActionStatus;
  detail: string;
}

export interface InstallOptions {
  target: InstallTarget;
  packageRoot: string;
  homeDir?: string;
  dryRun?: boolean;
  force?: boolean;
}

export interface PluginInstallReport {
  report_version: string;
  status: InstallStatus;
  target: InstallTarget;
  targets: ConcreteTarget[];
  dry_run: boolean;
  home_dir: string;
  package_root: string;
  actions: InstallAction[];
  blockers: string[];
  warnings: string[];
  front_doors: {
    codex: string;
    claude_code: string;
  };
  next_steps: string[];
}

interface MarketplaceJson {
  name?: string;
  interface?: { displayName?: string; [key: string]: unknown };
  plugins?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

const PLUGIN_COPY_ENTRIES = [
  ".codex-plugin",
  ".claude-plugin",
  ".mcp.json",
  "skills",
  "agents",
  "README.md",
  "LICENSE",
  "docs/quickstart.md",
  "docs/agent-lifecycle.md",
  "docs/install-codex-plugin.md",
  "docs/install-claude-code-plugin.md",
  "docs/release-readiness.md",
  "docs/use-with-mcp.md"
];

const CODEX_SKILL_COPY_ENTRIES = [
  { source: path.join("plugins", "codex", "skills", "archetype"), destinationName: "archetype" },
  { source: path.join("plugins", "codex", "skills", "archetype-blueprint"), destinationName: "archetype-blueprint" },
  { source: path.join("plugins", "codex", "skills", "archetype-implement"), destinationName: "archetype-implement" },
  { source: path.join("plugins", "codex", "skills", "archetype-verify"), destinationName: "archetype-verify" },
  { source: path.join("plugins", "codex", "skills", "archetype-revise"), destinationName: "archetype-revise" }
];

const CLAUDE_PLUGIN_COPY_ENTRIES = [
  { source: path.join("plugins", "claude-code", ".claude-plugin"), destination: ".claude-plugin" },
  { source: path.join("plugins", "claude-code", ".mcp.json"), destination: ".mcp.json" },
  { source: path.join("plugins", "claude-code", "commands"), destination: "commands" },
  { source: path.join("plugins", "claude-code", "skills"), destination: "skills" },
  { source: path.join("plugins", "claude-code", "agents"), destination: "agents" },
  { source: path.join("plugins", "claude-code", "assets"), destination: "assets" },
  { source: "README.md", destination: "README.md" },
  { source: "LICENSE", destination: "LICENSE" },
  { source: path.join("docs", "quickstart.md"), destination: path.join("docs", "quickstart.md") },
  { source: path.join("docs", "agent-lifecycle.md"), destination: path.join("docs", "agent-lifecycle.md") },
  { source: path.join("docs", "install-codex-plugin.md"), destination: path.join("docs", "install-codex-plugin.md") },
  { source: path.join("docs", "install-claude-code-plugin.md"), destination: path.join("docs", "install-claude-code-plugin.md") },
  { source: path.join("docs", "release-readiness.md"), destination: path.join("docs", "release-readiness.md") },
  { source: path.join("docs", "use-with-mcp.md"), destination: path.join("docs", "use-with-mcp.md") }
];

const CLAUDE_SKILL_COPY_ENTRIES = [
  { source: path.join("plugins", "claude-code", "skills", "archetype"), destinationName: "archetype" },
  { source: path.join("plugins", "claude-code", "skills", "blueprint"), destinationName: "archetype-blueprint" },
  { source: path.join("plugins", "claude-code", "skills", "implement"), destinationName: "archetype-implement" },
  { source: path.join("plugins", "claude-code", "skills", "verify"), destinationName: "archetype-verify" },
  { source: path.join("plugins", "claude-code", "skills", "revise"), destinationName: "archetype-revise" }
];

function readJsonSafe<T>(filePath: string, fallback: T): T {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function concreteTargets(target: InstallTarget): ConcreteTarget[] {
  if (target === "all") return ["codex", "claude"];
  return [target];
}

function addAction(
  actions: InstallAction[],
  target: ConcreteTarget,
  operation: string,
  destination: string,
  status: ActionStatus,
  detail: string,
  source?: string
): void {
  actions.push({
    target,
    operation,
    ...(source ? { source } : {}),
    destination,
    status,
    detail
  });
}

function copyPluginSurface(
  target: ConcreteTarget,
  packageRoot: string,
  destinationRoot: string,
  actions: InstallAction[],
  blockers: string[],
  dryRun: boolean
): void {
  for (const entry of PLUGIN_COPY_ENTRIES) {
    const source = path.join(packageRoot, entry);
    const destination = path.join(destinationRoot, entry);
    if (!existsSync(source)) {
      blockers.push(`Missing package plugin source: ${entry}`);
      addAction(actions, target, "copy_plugin_surface", destination, "failed", `${entry} is missing from the package.`, source);
      continue;
    }

    if (dryRun) {
      addAction(actions, target, "copy_plugin_surface", destination, "planned", `Would copy ${entry}.`, source);
      continue;
    }

    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(source, destination, { recursive: true, force: true });
    addAction(actions, target, "copy_plugin_surface", destination, "written", `Copied ${entry}.`, source);
  }
}

function copyCodexSkills(
  packageRoot: string,
  codexSkillsRoot: string,
  actions: InstallAction[],
  blockers: string[],
  dryRun: boolean
): void {
  for (const entry of CODEX_SKILL_COPY_ENTRIES) {
    const source = path.join(packageRoot, entry.source);
    const destination = path.join(codexSkillsRoot, entry.destinationName);
    if (!existsSync(source)) {
      blockers.push(`Missing Codex skill source: ${entry.source}`);
      addAction(actions, "codex", "copy_codex_skill", destination, "failed", `${entry.source} is missing from the package.`, source);
      continue;
    }

    if (dryRun) {
      addAction(actions, "codex", "copy_codex_skill", destination, "planned", `Would copy ${entry.destinationName} into Codex skills.`, source);
      continue;
    }

    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(source, destination, { recursive: true, force: true });
    addAction(actions, "codex", "copy_codex_skill", destination, "written", `Copied ${entry.destinationName} into Codex skills.`, source);
  }
}

function copyMappedEntries(
  target: ConcreteTarget,
  packageRoot: string,
  destinationRoot: string,
  entries: Array<{ source: string; destination: string }>,
  actions: InstallAction[],
  blockers: string[],
  dryRun: boolean
): void {
  for (const entry of entries) {
    const source = path.join(packageRoot, entry.source);
    const destination = path.join(destinationRoot, entry.destination);
    if (!existsSync(source)) {
      blockers.push(`Missing package plugin source: ${entry.source}`);
      addAction(actions, target, "copy_plugin_surface", destination, "failed", `${entry.source} is missing from the package.`, source);
      continue;
    }

    if (dryRun) {
      addAction(actions, target, "copy_plugin_surface", destination, "planned", `Would copy ${entry.source}.`, source);
      continue;
    }

    mkdirSync(path.dirname(destination), { recursive: true });
    rmSync(destination, { recursive: true, force: true });
    cpSync(source, destination, { recursive: true, force: true });
    addAction(actions, target, "copy_plugin_surface", destination, "written", `Copied ${entry.source}.`, source);
  }
}

function copyClaudeSkills(
  packageRoot: string,
  claudeSkillsRoot: string,
  actions: InstallAction[],
  blockers: string[],
  dryRun: boolean
): void {
  for (const entry of CLAUDE_SKILL_COPY_ENTRIES) {
    const source = path.join(packageRoot, entry.source);
    const destination = path.join(claudeSkillsRoot, entry.destinationName);
    if (!existsSync(source)) {
      blockers.push(`Missing Claude skill source: ${entry.source}`);
      addAction(actions, "claude", "copy_claude_skill", destination, "failed", `${entry.source} is missing from the package.`, source);
      continue;
    }

    if (dryRun) {
      addAction(actions, "claude", "copy_claude_skill", destination, "planned", `Would copy ${entry.destinationName} into Claude skills.`, source);
      continue;
    }

    mkdirSync(path.dirname(destination), { recursive: true });
    rmSync(destination, { recursive: true, force: true });
    cpSync(source, destination, { recursive: true, force: true });
    addAction(actions, "claude", "copy_claude_skill", destination, "written", `Copied ${entry.destinationName} into Claude skills.`, source);
  }
}

function tryRunClaudePluginCommand(
  args: string[],
  operation: string,
  destination: string,
  actions: InstallAction[],
  warnings: string[],
  dryRun: boolean,
  canRun: boolean
): void {
  if (dryRun) {
    addAction(actions, "claude", operation, destination, "planned", `Would run claude ${args.join(" ")}.`);
    return;
  }

  if (!canRun) {
    addAction(actions, "claude", operation, destination, "skipped", "Skipped Claude Code CLI mutation because --home is not the active user home.");
    return;
  }

  const result = spawnSync("claude", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.error) {
    warnings.push(`Claude Code CLI is unavailable for ${operation}: ${result.error.message}`);
    addAction(actions, "claude", operation, destination, "skipped", `Claude Code CLI unavailable: ${result.error.message}`);
    return;
  }

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || `claude exited with ${result.status}`).trim();
    warnings.push(`Claude Code ${operation} did not complete automatically: ${detail}`);
    addAction(actions, "claude", operation, destination, "skipped", detail);
    return;
  }

  addAction(actions, "claude", operation, destination, "written", (result.stdout || `Ran claude ${args.join(" ")}.`).trim());
}

function codexMarketplaceEntry(): Record<string, unknown> {
  return {
    name: "archetype",
    source: {
      source: "local",
      path: "./plugins/archetype"
    },
    policy: {
      installation: "INSTALLED_BY_DEFAULT",
      authentication: "ON_USE"
    },
    category: "Coding"
  };
}

function writeCodexMarketplace(homeDir: string, actions: InstallAction[], dryRun: boolean): void {
  const marketplacePath = path.join(homeDir, ".agents", "plugins", "marketplace.json");
  if (dryRun) {
    addAction(
      actions,
      "codex",
      "write_marketplace",
      marketplacePath,
      "planned",
      "Would register Archetype in the Codex home-local plugin marketplace."
    );
    return;
  }

  const marketplace = readJsonSafe<MarketplaceJson>(marketplacePath, {});
  const existed = existsSync(marketplacePath);
  const plugins = (marketplace.plugins ?? []).filter((plugin) => plugin.name !== "archetype");
  const nextMarketplace: MarketplaceJson = {
    ...marketplace,
    name: marketplace.name ?? "archetype-local",
    interface: {
      displayName: marketplace.interface?.displayName ?? "Archetype Local",
      ...marketplace.interface
    },
    plugins: [...plugins, codexMarketplaceEntry()]
  };
  writeJson(marketplacePath, nextMarketplace);
  addAction(
    actions,
    "codex",
    "write_marketplace",
    marketplacePath,
    existed ? "updated" : "written",
    "Registered Archetype in the Codex home-local plugin marketplace."
  );
}

function claudeMarketplaceEntry(): Record<string, unknown> {
  return {
    name: "archetype",
    description: "Spec-driven frontend agent harness for Claude Code and Codex.",
    version: "0.1.0",
    source: "./plugins/archetype",
    author: {
      name: "Nikola Cehic"
    }
  };
}

function writeClaudeMarketplace(homeDir: string, actions: InstallAction[], dryRun: boolean): string {
  const marketplaceRoot = path.join(homeDir, ".claude", "plugins", "marketplaces", "archetype-local");
  const marketplacePath = path.join(marketplaceRoot, ".claude-plugin", "marketplace.json");
  if (dryRun) {
    addAction(
      actions,
      "claude",
      "write_marketplace",
      marketplacePath,
      "planned",
      "Would register Archetype in a Claude Code local marketplace."
    );
    return marketplaceRoot;
  }

  const marketplace = readJsonSafe<MarketplaceJson>(marketplacePath, {});
  const existed = existsSync(marketplacePath);
  const plugins = (marketplace.plugins ?? []).filter((plugin) => plugin.name !== "archetype");
  const nextMarketplace: MarketplaceJson = {
    ...marketplace,
    name: marketplace.name ?? "archetype-local",
    description: marketplace.description ?? "Local Archetype marketplace for Claude Code plugin installs.",
    owner: marketplace.owner ?? {
      name: "Nikola Cehic",
      url: "https://github.com/NikolaCehic"
    },
    plugins: [...plugins, claudeMarketplaceEntry()]
  };
  writeJson(marketplacePath, nextMarketplace);
  addAction(
    actions,
    "claude",
    "write_marketplace",
    marketplacePath,
    existed ? "updated" : "written",
    "Registered Archetype in a Claude Code local marketplace."
  );
  return marketplaceRoot;
}

export function installAgentPlugins(options: InstallOptions): PluginInstallReport {
  const packageRoot = path.resolve(options.packageRoot);
  const homeDir = path.resolve(options.homeDir ?? os.homedir());
  const dryRun = options.dryRun ?? false;
  const targets = concreteTargets(options.target);
  const actions: InstallAction[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(path.join(packageRoot, ".codex-plugin", "plugin.json"))) {
    blockers.push("Package root is missing .codex-plugin/plugin.json.");
  }
  if (!existsSync(path.join(packageRoot, ".claude-plugin", "plugin.json"))) {
    blockers.push("Package root is missing .claude-plugin/plugin.json.");
  }
  if (!existsSync(path.join(packageRoot, "skills", "archetype", "SKILL.md"))) {
    blockers.push("Package root is missing skills/archetype/SKILL.md.");
  }
  if (!existsSync(path.join(packageRoot, ".mcp.json"))) {
    blockers.push("Package root is missing .mcp.json.");
  }

  if (targets.includes("codex")) {
    const codexPluginRoot = path.join(homeDir, "plugins", "archetype");
    const codexNativePluginRoot = path.join(homeDir, ".codex", "plugins", "archetype");
    const codexSkillsRoot = path.join(homeDir, ".codex", "skills");
    copyPluginSurface("codex", packageRoot, codexPluginRoot, actions, blockers, dryRun);
    copyPluginSurface("codex", packageRoot, codexNativePluginRoot, actions, blockers, dryRun);
    copyCodexSkills(packageRoot, codexSkillsRoot, actions, blockers, dryRun);
    writeCodexMarketplace(homeDir, actions, dryRun);
  }

  if (targets.includes("claude")) {
    const marketplaceRoot = writeClaudeMarketplace(homeDir, actions, dryRun);
    const claudePluginRoot = path.join(marketplaceRoot, "plugins", "archetype");
    const shouldRunClaudeCli = path.resolve(homeDir) === path.resolve(os.homedir());
    copyMappedEntries("claude", packageRoot, claudePluginRoot, CLAUDE_PLUGIN_COPY_ENTRIES, actions, blockers, dryRun);
    copyClaudeSkills(packageRoot, path.join(homeDir, ".claude", "skills"), actions, blockers, dryRun);
    tryRunClaudePluginCommand(["plugin", "marketplace", "add", marketplaceRoot], "register_claude_marketplace", marketplaceRoot, actions, warnings, dryRun, shouldRunClaudeCli);
    tryRunClaudePluginCommand(["plugin", "install", "archetype@archetype-local"], "install_claude_plugin", "archetype@archetype-local", actions, warnings, dryRun, shouldRunClaudeCli);
    tryRunClaudePluginCommand(["plugin", "update", "archetype@archetype-local"], "update_claude_plugin", "archetype@archetype-local", actions, warnings, dryRun, shouldRunClaudeCli);
  }

  if (dryRun) warnings.push("Dry run only: no plugin files were written.");

  const status: InstallStatus = blockers.length > 0 ? "fail" : warnings.length > 0 ? "warning" : "pass";
  return {
    report_version: "1.0",
    status,
    target: options.target,
    targets,
    dry_run: dryRun,
    home_dir: homeDir,
    package_root: packageRoot,
    actions,
    blockers,
    warnings,
    front_doors: {
      codex: "$archetype \"I want to build a premium B2B analytics app for marketing teams.\"",
      claude_code: "/archetype \"I want to build a premium B2B analytics app for marketing teams.\""
    },
    next_steps: [
      "Start a fresh Codex or Claude Code session after installing.",
      "Use $archetype in Codex or /archetype in Claude Code with a natural-language product idea.",
      "Archetype will ask clarification questions, invite optional materials, generate the contract, drive tests first, verify, and repair."
    ]
  };
}
