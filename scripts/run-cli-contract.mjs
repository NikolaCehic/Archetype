import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "cli-contract");
const intakePath = path.join(workspace, "archetype.intake.json");
const outputDir = path.join(workspace, "archetype-output");
const targetDir = path.join(workspace, "generated-frontend");

rmSync(workspace, { recursive: true, force: true });
mkdirSync(workspace, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(args) {
  return execFileSync("node", ["dist/cli.js", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function runJson(args) {
  const stdout = run([...args, "--json"]);
  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Command did not return parseable JSON: archetype ${args.join(" ")}\n${stdout}\n${error}`);
  }
}

function runJsonMaybeFail(args) {
  const result = spawnSync("node", ["dist/cli.js", ...args, "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  try {
    return {
      exitCode: result.status ?? 1,
      json: JSON.parse(result.stdout)
    };
  } catch (error) {
    throw new Error(`Command did not return parseable JSON: archetype ${args.join(" ")}\n${result.stdout}\n${result.stderr}\n${error}`);
  }
}

const help = run(["--help"]);
assert(
  help.includes("Archetype generates frontend implementation contracts for AI coding agents."),
  "CLI help must use pivot positioning."
);
assert(help.includes("archetype doctor"), "CLI help must expose doctor command.");
assert(help.includes("archetype install"), "CLI help must expose install command.");

const doctor = runJson(["doctor"]);
assert(doctor.status === "pass", "doctor --json should pass.");
assert(doctor.quickstart.published_package.some((command) => command.includes("archetype install --target all --json")), "doctor should expose one-command plugin install.");
assert(doctor.docs.some((doc) => doc.path === "docs/agent-lifecycle.md"), "doctor should expose agent lifecycle docs.");

const install = runJson(["install", "--target", "all", "--home", path.join(workspace, "dry-home"), "--dry-run"]);
assert(install.status === "warning", "install dry-run should warn that no files were written.");
assert(install.actions.every((action) => action.status === "planned"), "install dry-run should only plan actions.");
assert(install.front_doors.codex.startsWith("@Archetype"), "install should expose Codex front door.");
assert(install.front_doors.claude_code.startsWith("/archetype"), "install should expose Claude Code front door.");

const init = runJson(["init", "--template", "saas-dashboard", "--out", intakePath]);
assert(init.status === "success", "init --json should succeed.");
assert(init.intakePath === intakePath, "init should report the created intake path.");

const generate = runJson(["generate", "--input", intakePath, "--out", outputDir]);
assert(["success", "warning"].includes(generate.status), "generate --json should return success or warning.");
assert(generate.outputDir === outputDir, "generate should report the output directory.");
assert(generate.readyForFrontendAgent === true, "SaaS dashboard example should be ready for frontend agents.");
assert(
  generate.artifacts.some((artifact) => artifact.id === "implementation-contract"),
  "generate result should include implementation-contract artifact."
);
for (const requiredArtifact of [
  "product/product-model.json",
  "lifecycle/state-machine.json",
  "lifecycle/context-completion.json",
  "lifecycle/clarification-questions.json",
  "lifecycle/lifecycle-report.md",
  "spec/archetype-spec.md",
  "spec/archetype-spec.json",
  "test-first/test-first-contract.json",
  "test-first/test-first-plan.md",
  "test-first/playwright-contract.spec.ts",
  "test-first/vitest-contract.spec.ts",
  "verification/playwright-verification-contract.json",
  "verification/playwright-verification-plan.md",
  "verification/playwright.config.ts",
  "verification/playwright-verification.spec.ts",
  "verification/playwright-evidence.json",
  "verification/playwright-evidence.md",
  "10-revision/verification-repair-contract.json",
  "10-revision/repair-task-queue.json",
  "10-revision/repair-plan.md",
  "10-revision/drift-report.json",
  "10-revision/drift-report.md",
  "experience/route-map.json",
  "design-system/tokens.json",
  "design-system/component-contracts.json",
  "screens/screen-inventory.json",
  "screens/screen-specs.json",
  "frontend-agent-contract/frontend-agent-instructions.md",
  "frontend-agent-contract/implementation-rules.json",
  "validation/package-validation.json",
  "validation/simulation-report.md"
]) {
  assert(existsSync(path.join(outputDir, requiredArtifact)), `Generated package is missing ${requiredArtifact}.`);
}

const summarize = runJson(["summarize", "--out", outputDir]);
assert(["success", "warning"].includes(summarize.status), "summarize --json should return success or warning.");
assert(summarize.product === "SignalDesk", "summarize should report the product name.");
assert(summarize.routes === 6, "summarize should report route count.");
assert(summarize.screens === 6, "summarize should report screen count.");
assert(summarize.requiredStates.includes("loading"), "summarize should include required states.");
assert(summarize.entrypoints.includes("lifecycle/context-completion.json"), "summarize should include lifecycle context entrypoint.");
assert(summarize.entrypoints.includes("spec/archetype-spec.json"), "summarize should include canonical spec entrypoint.");
assert(summarize.entrypoints.includes("test-first/test-first-contract.json"), "summarize should include test-first contract entrypoint.");
assert(summarize.entrypoints.includes("verification/playwright-verification-contract.json"), "summarize should include Playwright verification entrypoint.");
assert(summarize.entrypoints.includes("10-revision/repair-task-queue.json"), "summarize should include repair task queue entrypoint.");

const validate = runJson(["validate", "--out", outputDir]);
assert(validate.status === "pass", "validate --json should pass.");
assert(validate.checkedFiles > 0, "validate should check manifest artifacts.");

const implementationContractPath = path.join(outputDir, "implementation-contract.md");
const implementationContract = readFileSync(implementationContractPath, "utf8");
rmSync(implementationContractPath);
const failedValidate = runJsonMaybeFail(["validate", "--out", outputDir]);
assert(failedValidate.exitCode === 1, "validate should exit non-zero when a required artifact is missing.");
assert(failedValidate.json.status === "fail", "validate should report fail when a required artifact is missing.");
assert(
  failedValidate.json.blockers.some((blocker) => String(blocker).includes("implementation-contract.md")),
  "validate should name the missing implementation contract."
);
writeFileSync(implementationContractPath, implementationContract);

const simulate = runJson(["simulate", "--out", outputDir]);
assert(["pass", "warning"].includes(simulate.status), "simulate --json should pass or warn.");
assert(simulate.summary.routes === 6, "simulate should report route simulation coverage.");

const writeTarget = runJson(["write-target", "--out", outputDir, "--target", targetDir, "--force"]);
assert(writeTarget.status === "pass", "write-target --json should pass.");
assert(writeTarget.filesWritten > 0, "write-target should report written files.");

const verifyTarget = runJson(["verify-target", "--out", outputDir, "--target", targetDir]);
assert(verifyTarget.status === "pass", "verify-target --json should pass.");
assert(verifyTarget.summary.install === "pass", "verify-target should install dependencies.");
assert(verifyTarget.summary.typecheck === "pass", "verify-target should typecheck.");
assert(verifyTarget.summary.build === "pass", "verify-target should build.");
assert(verifyTarget.summary.playwright === "pass", "verify-target should run Playwright verification.");
assert(verifyTarget.repair.status === "pass", "verify-target should write passing repair status.");
assert(verifyTarget.repair.taskCount === 0, "verify-target should have no repair tasks after passing verification.");

const repair = runJson(["repair", "--out", outputDir, "--target", targetDir]);
assert(repair.status === "pass", "repair --json should report pass after successful verification.");
assert(repair.taskCount === 0, "repair --json should report no tasks after successful verification.");

const summary = {
  status: "pass",
  commands: {
    doctor: doctor.status,
    init: init.status,
    generate: generate.status,
    summarize: summarize.status,
    validate: validate.status,
    simulate: simulate.status,
    writeTarget: writeTarget.status,
    verifyTarget: verifyTarget.status
  },
  outputDir,
  targetDir
};

writeFileSync(path.join(workspace, "cli-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
