import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "release-readiness-contract");
const installDir = path.join(workspace, "consumer");

rmSync(workspace, { recursive: true, force: true });
mkdirSync(installDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? root,
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

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function requestMcp(command, args, method, params = {}, timeoutMs = 30000) {
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

function extractToolPayload(result) {
  if (result.structuredContent) return result.structuredContent;
  const text = result.content?.[0]?.text;
  if (!text) throw new Error(`MCP tool returned no content: ${JSON.stringify(result)}`);
  return JSON.parse(text);
}

function packTarball() {
  const packed = runJson("npm", ["pack", "--json"]);
  const item = packed[0];
  const fileName = item?.filename;
  assert(typeof fileName === "string" && fileName.endsWith(".tgz"), "npm pack should return a tarball filename.");
  const tarballPath = path.join(root, fileName);
  assert(existsSync(tarballPath), `Packed tarball missing: ${tarballPath}`);
  return { tarballPath, files: item.files ?? [] };
}

const sourceDoctor = runJson("node", ["dist/cli.js", "doctor", "--json"]);
assert(sourceDoctor.status === "pass", "source doctor should pass.");
assert(sourceDoctor.quickstart.published_package.length === 3, "doctor should expose a three-command published quickstart.");
assert(sourceDoctor.quickstart.published_package[0].includes("archetype install --target all --json"), "doctor should expose one-command plugin install.");
assert(sourceDoctor.plugin_setup.claude_code.front_door.includes("/archetype"), "doctor should expose Claude Code front door.");
assert(sourceDoctor.plugin_setup.codex.front_door.includes("$archetype"), "doctor should expose Codex front door.");
assert(sourceDoctor.lifecycle.includes("Clarify missing context"), "doctor should expose lifecycle steps.");
assert(sourceDoctor.mcp_tools.includes("archetype_release_doctor"), "doctor should name release doctor MCP tool.");
assert(sourceDoctor.mcp_tools.includes("archetype_answer_clarification"), "doctor should name one-question clarification MCP tool.");

for (const [file, expected] of [
  ["README.md", ["archetype install --target all --json", "docs/quickstart.md", "docs/agent-lifecycle.md", "docs/release-readiness.md"]],
  ["docs/quickstart.md", ["60 seconds", "archetype install --target all --json", "archetype doctor --json", "archetype generate"]],
  ["docs/agent-lifecycle.md", ["clarify missing context", "optional materials", "canonical spec", "tests first", "Playwright", "repair"]],
  ["docs/release-readiness.md", ["archetype doctor", "npm run release:contract", "npm run plugin-install:contract", "npm run repo:audit", "npm run install:contract", "npm pack --dry-run --json"]]
]) {
  const text = readText(file);
  for (const value of expected) {
    assert(text.includes(value), `${file} missing ${value}.`);
  }
}

let tarballPath = "";
try {
  const packed = packTarball();
  tarballPath = packed.tarballPath;
  const packedPaths = new Set(packed.files.map((file) => file.path));
  for (const required of [
    "dist/release/doctor.js",
    "dist/install/pluginInstaller.js",
    "dist/mcp/tools/releaseDoctor.js",
    ".codex-plugin/plugin.json",
    ".claude-plugin/plugin.json",
    ".mcp.json",
    ".agents/plugins/marketplace.json",
    "skills/archetype/SKILL.md",
    "agents/product-architect.md",
    "docs/quickstart.md",
    "docs/agent-lifecycle.md",
    "docs/release-readiness.md",
    "scripts/run-release-readiness-contract.mjs",
    "scripts/run-plugin-install-contract.mjs",
    "scripts/run-repository-audit.mjs"
  ]) {
    assert(packedPaths.has(required), `packed package missing ${required}.`);
  }
  for (const forbidden of ["iterations/iteration-index.md", "reinforcement-learning/lessons.md", "archetype-plugin-pivot-md/START_HERE.md"]) {
    assert(!packedPaths.has(forbidden), `packed package includes non-publishable internal artifact ${forbidden}.`);
  }

  writeFileSync(path.join(installDir, "package.json"), `${JSON.stringify({ private: true, type: "module" }, null, 2)}\n`);
  run("npm", ["install", tarballPath], { cwd: installDir });
  const cliBin = path.join(installDir, "node_modules", ".bin", "archetype");
  const mcpBin = path.join(installDir, "node_modules", ".bin", "archetype-mcp");
  const installedDoctor = runJson(cliBin, ["doctor", "--json"], { cwd: installDir });
  assert(installedDoctor.status === "pass", "installed doctor should pass.");
  assert(installedDoctor.package_mode === "installed_package", "installed doctor should report installed package mode.");

  const npxDoctor = runJson("npx", ["-y", "-p", tarballPath, "archetype", "doctor", "--json"], { cwd: installDir });
  assert(npxDoctor.status === "pass", "npx doctor should pass.");

  const mcpTools = await requestMcp(mcpBin, [], "tools/list");
  const toolNames = new Set((mcpTools.tools ?? []).map((tool) => tool.name));
  assert(toolNames.has("archetype_release_doctor"), "installed MCP server should expose archetype_release_doctor.");
  assert(toolNames.has("archetype_answer_clarification"), "installed MCP server should expose archetype_answer_clarification.");
  const doctorToolResult = await requestMcp(mcpBin, [], "tools/call", {
    name: "archetype_release_doctor",
    arguments: {}
  });
  const doctorPayload = extractToolPayload(doctorToolResult);
  assert(doctorPayload.status === "pass", "MCP release doctor should pass.");
  assert(doctorPayload.docs.some((doc) => doc.path === "docs/agent-lifecycle.md"), "MCP release doctor should name lifecycle docs.");

  const summary = {
    status: "pass",
    sourceStatus: sourceDoctor.status,
    installedStatus: installedDoctor.status,
    npxStatus: npxDoctor.status,
    mcpToolStatus: doctorPayload.status,
    packedDocs: [...packedPaths].filter((item) => item.startsWith("docs/")).sort()
  };
  writeFileSync(path.join(workspace, "release-readiness-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
} finally {
  if (tarballPath) rmSync(tarballPath, { force: true });
}
