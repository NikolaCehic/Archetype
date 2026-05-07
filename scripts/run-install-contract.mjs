import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "install-contract");
const installDir = path.join(workspace, "consumer");
const started = Date.now();

rmSync(workspace, { recursive: true, force: true });
mkdirSync(installDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? installDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      CI: "1",
      npm_config_audit: "false",
      npm_config_fund: "false"
    }
  });
}

function runJson(command, args, options = {}) {
  const stdout = run(command, args, options);
  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Command did not return JSON: ${command} ${args.join(" ")}\n${stdout}\n${error}`);
  }
}

function packTarball() {
  const raw = run("npm", ["pack", "--json"], { cwd: root });
  const items = JSON.parse(raw);
  const fileName = items[0]?.filename;
  assert(typeof fileName === "string" && fileName.endsWith(".tgz"), "npm pack did not return a tarball filename.");
  const tarballPath = path.join(root, fileName);
  assert(existsSync(tarballPath), `Packed tarball missing: ${tarballPath}`);
  return tarballPath;
}

function requestMcp(command, args, method, params = {}, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: installDir,
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    const id = 1;
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Timed out waiting for MCP ${method}: ${command} ${args.join(" ")}\n${stderr}`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
      const line = stdout.split("\n").find((item) => item.trim().length > 0);
      if (!line) return;
      clearTimeout(timer);
      child.kill();
      try {
        const response = JSON.parse(line);
        if (response.error) reject(new Error(JSON.stringify(response.error)));
        else resolve(response.result);
      } catch (error) {
        reject(new Error(`Invalid MCP JSON response: ${line}\n${error}`));
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  });
}

let tarballPath = "";
try {
  tarballPath = packTarball();
  writeFileSync(path.join(installDir, "package.json"), `${JSON.stringify({ private: true, type: "module" }, null, 2)}\n`);
  run("npm", ["install", tarballPath]);

  const packageRoot = path.join(installDir, "node_modules", "@nikolacehic", "archetype");
  const cliBin = path.join(installDir, "node_modules", ".bin", "archetype");
  const mcpBin = path.join(installDir, "node_modules", ".bin", "archetype-mcp");
  assert(existsSync(cliBin), "Installed package is missing archetype bin.");
  assert(existsSync(mcpBin), "Installed package is missing archetype-mcp bin.");

  const version = run(cliBin, ["--version"]).trim();
  assert(version === "0.1.0", `Unexpected installed CLI version: ${version}`);
  const doctor = runJson(cliBin, ["doctor", "--json"]);
  assert(doctor.status === "pass", "Installed CLI doctor should pass.");
  assert(doctor.package_mode === "installed_package", "Installed CLI doctor should report installed package mode.");

  const intakePath = path.join(installDir, "archetype.intake.json");
  const outputDir = path.join(installDir, "archetype-output");
  const init = runJson(cliBin, ["init", "--template", "saas-dashboard", "--out", intakePath, "--force", "--json"]);
  assert(init.status === "success", "Installed CLI init should succeed.");

  const generate = runJson(cliBin, ["generate", "--input", intakePath, "--out", outputDir, "--json"]);
  assert(["success", "warning"].includes(generate.status), "Installed CLI generate should succeed or warn.");
  assert(generate.readyForFrontendAgent === false, "Installed CLI draft output should not be implementation-ready before human approval.");
  assert(generate.blockers.some((blocker) => blocker.includes("canonical contract is not approved by a human reviewer")), "Installed CLI output should expose the approval gate.");

  const validate = runJson(cliBin, ["validate", "--out", outputDir, "--json"]);
  assert(validate.status === "pass", "Installed CLI validate should pass.");

  const summarize = runJson(cliBin, ["summarize", "--out", outputDir, "--json"]);
  assert(summarize.product === "SignalDesk", "Installed CLI summarize should report SignalDesk.");
  assert(summarize.routes === 6, "Installed CLI summarize should report route count.");
  assert(summarize.screens === 6, "Installed CLI summarize should report screen count.");

  const mcpInit = await requestMcp(mcpBin, [], "initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "archetype-install-contract", version: "0.1.0" }
  });
  assert(mcpInit.serverInfo?.name === "archetype-mcp", "Installed MCP server should initialize.");

  const mcpTools = await requestMcp(mcpBin, [], "tools/list");
  const toolNames = new Set((mcpTools.tools ?? []).map((tool) => tool.name));
  for (const toolName of ["archetype_release_doctor", "archetype_create_intake", "archetype_answer_clarification", "archetype_generate_package", "archetype_validate_package", "archetype_summarize_package", "archetype_read_artifact", "archetype_verify_target", "archetype_plan_repair"]) {
    assert(toolNames.has(toolName), `Installed MCP server missing ${toolName}.`);
  }

  for (const pluginFile of [
    ".codex-plugin/plugin.json",
    ".claude-plugin/plugin.json",
    ".claude-plugin/marketplace.json",
    ".agents/plugins/marketplace.json",
    ".mcp.json",
    "skills/archetype/SKILL.md",
    "skills/implement/SKILL.md",
    "agents/product-architect.md",
    "dist/install/pluginInstaller.js",
    "plugins/claude-code/.claude-plugin/plugin.json",
    "plugins/claude-code/.mcp.json",
    "plugins/claude-code/commands/archetype.md",
    "plugins/claude-code/skills/archetype/SKILL.md",
    "plugins/codex/.codex-plugin/plugin.json",
    "plugins/codex/.mcp.json",
    "plugins/codex/skills/archetype/SKILL.md",
    "docs/quickstart.md",
    "docs/agent-lifecycle.md",
    "docs/release-readiness.md",
    "scripts/run-demo.mjs",
    "scripts/run-lifecycle-contract.mjs",
    "scripts/run-spec-contract.mjs",
    "scripts/run-test-first-contract.mjs",
    "scripts/run-test-quality-standard-contract.mjs",
    "scripts/run-required-package-artifacts-contract.mjs",
    "scripts/run-forbidden-behaviors-contract.mjs",
    "scripts/run-marketing-dashboard-replay-contract.mjs",
    "scripts/run-implementation-phases-contract.mjs",
    "scripts/run-convergence-standard-contract.mjs",
    "scripts/run-playwright-verification-contract.mjs",
    "scripts/run-repair-contract.mjs",
    "scripts/run-plugin-install-contract.mjs",
    "scripts/run-repository-audit.mjs",
    "scripts/run-release-readiness-contract.mjs"
  ]) {
    assert(existsSync(path.join(packageRoot, pluginFile)), `Installed package missing ${pluginFile}.`);
  }

  for (const deadFile of ["dist/llm/provider.js", "dist/llm/structuredOutput.js", "dist/llm/types.js"]) {
    assert(!existsSync(path.join(packageRoot, deadFile)), `Installed package still contains stale provider code: ${deadFile}`);
  }

  const npxIntakePath = path.join(installDir, "npx.intake.json");
  const npxOutputDir = path.join(installDir, "npx-output");
  const npxVersion = run("npx", ["-y", "-p", tarballPath, "archetype", "--version"]).trim();
  assert(npxVersion === "0.1.0", `Unexpected npx CLI version: ${npxVersion}`);
  const npxDoctor = runJson("npx", ["-y", "-p", tarballPath, "archetype", "doctor", "--json"]);
  assert(npxDoctor.status === "pass", "npx CLI doctor should pass.");

  const npxInit = runJson("npx", ["-y", "-p", tarballPath, "archetype", "init", "--template", "saas-dashboard", "--out", npxIntakePath, "--force", "--json"]);
  assert(npxInit.status === "success", "npx CLI init should succeed.");

  const npxGenerate = runJson("npx", ["-y", "-p", tarballPath, "archetype", "generate", "--input", npxIntakePath, "--out", npxOutputDir, "--json"]);
  assert(["success", "warning"].includes(npxGenerate.status), "npx CLI generate should succeed or warn.");
  assert(npxGenerate.readyForFrontendAgent === false, "npx CLI draft output should not be implementation-ready before human approval.");
  assert(npxGenerate.blockers.some((blocker) => blocker.includes("canonical contract is not approved by a human reviewer")), "npx CLI output should expose the approval gate.");

  const npxValidate = runJson("npx", ["-y", "-p", tarballPath, "archetype", "validate", "--out", npxOutputDir, "--json"]);
  assert(npxValidate.status === "pass", "npx CLI validate should pass.");

  const npxMcpInit = await requestMcp("npx", ["-y", "-p", tarballPath, "archetype-mcp"], "initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "archetype-npx-contract", version: "0.1.0" }
  });
  assert(npxMcpInit.serverInfo?.name === "archetype-mcp", "npx MCP server should initialize.");

  const durationMs = Date.now() - started;
  assert(durationMs < 60000, `Install contract exceeded 60 seconds: ${durationMs}ms.`);

  const summary = {
    status: "pass",
    durationMs,
    version,
    npxVersion,
    doctorStatus: doctor.status,
    npxDoctorStatus: npxDoctor.status,
    outputDir,
    npxOutputDir,
    product: summarize.product,
    routes: summarize.routes,
    screens: summarize.screens,
    mcpTools: [...toolNames].sort()
  };
  writeFileSync(path.join(workspace, "install-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
} finally {
  if (tarballPath) rmSync(tarballPath, { force: true });
}
