import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "cli-contract");
const intakePath = path.join(workspace, "archetype.intake.json");
const outputDir = path.join(workspace, "archetype-output");
const approvedIntakePath = path.join(workspace, "archetype.approved.intake.json");
const approvedOutputDir = path.join(workspace, "archetype-approved-output");
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
assert(help.includes("archetype answer-clarification"), "CLI help must expose one-question clarification answer command.");

const doctor = runJson(["doctor"]);
assert(doctor.status === "pass", "doctor --json should pass.");
assert(doctor.quickstart.published_package.some((command) => command.includes("archetype install --target all --json")), "doctor should expose one-command plugin install.");
assert(doctor.docs.some((doc) => doc.path === "docs/agent-lifecycle.md"), "doctor should expose agent lifecycle docs.");

const install = runJson(["install", "--target", "all", "--home", path.join(workspace, "dry-home"), "--dry-run"]);
assert(install.status === "warning", "install dry-run should warn that no files were written.");
assert(install.actions.every((action) => action.status === "planned"), "install dry-run should only plan actions.");
assert(install.front_doors.codex.startsWith("$archetype"), "install should expose Codex front door.");
assert(install.front_doors.claude_code.startsWith("/archetype"), "install should expose Claude Code front door.");

const init = runJson(["init", "--template", "saas-dashboard", "--out", intakePath]);
assert(init.status === "success", "init --json should succeed.");
assert(init.intakePath === intakePath, "init should report the created intake path.");

const generate = runJson(["generate", "--input", intakePath, "--out", outputDir]);
assert(["success", "warning"].includes(generate.status), "generate --json should return success or warning.");
assert(generate.outputDir === outputDir, "generate should report the output directory.");
assert(generate.packageType === "draft_contract", "unapproved SaaS dashboard should generate a draft contract package.");
assert(generate.readyForFrontendAgent === false, "SaaS dashboard draft should not be implementation-ready before human contract approval.");
assert(generate.readinessTier === "ready_for_contract_approval", "SaaS dashboard draft should be waiting for contract approval.");
assert(generate.blockers.some((blocker) => blocker.includes("canonical contract is not approved by a human reviewer")), "generate should block implementation authorization until human approval.");
assert(
  generate.artifacts.some((artifact) => artifact.id === "frontend-contract-draft"),
  "generate result should include frontend contract draft artifact."
);
for (const requiredArtifact of [
  "lifecycle/state-machine.json",
  "lifecycle/start-request.json",
  "lifecycle/context-completion.json",
  "lifecycle/context-matrix.json",
  "lifecycle/readiness-tiers.json",
  "lifecycle/implementation-phases.json",
  "lifecycle/clarification-turn.json",
  "lifecycle/clarification-state.json",
  "lifecycle/clarification-transcript.md",
  "01-evidence/evidence-ledger.json",
  "01-evidence/missing-context.md",
  "governance/non-negotiable-principles.json",
  "governance/evidence-decision-model.json",
  "governance/convergence-standard.json",
  "lifecycle/clarification-questions.json",
  "lifecycle/lifecycle-report.md",
  "lifecycle/contract-state.json",
  "draft/product-model.draft.json",
  "draft/experience-architecture.draft.json",
  "draft/design-system.draft.json",
  "draft/frontend-contract.draft.json",
  "draft/assumption-ledger.md",
  "draft/specialist-review.json",
  "draft/contract-approval-request.json"
]) {
  assert(existsSync(path.join(outputDir, requiredArtifact)), `Generated package is missing ${requiredArtifact}.`);
}
for (const forbiddenArtifact of [
  "spec/archetype-spec.md",
  "spec/archetype-spec.json",
  "test-first/test-first-contract.json",
  "frontend-agent-contract/frontend-agent-instructions.md",
  "frontend-agent-contract/implementation-rules.json",
  "implementation-contract.md"
]) {
  assert(!existsSync(path.join(outputDir, forbiddenArtifact)), `Draft package must not include ${forbiddenArtifact}.`);
}

const summarize = runJson(["summarize", "--out", outputDir]);
assert(["success", "warning"].includes(summarize.status), "summarize --json should return success or warning.");
assert(summarize.product === "SignalDesk", "summarize should report the product name.");
assert(summarize.routes === 6, "summarize should report route count.");
assert(summarize.screens === 6, "summarize should report screen count.");
assert(summarize.requiredStates.includes("loading"), "summarize should include required states.");
assert(summarize.entrypoints.includes("lifecycle/start-request.json"), "summarize should include start request entrypoint.");
assert(summarize.entrypoints.includes("lifecycle/context-completion.json"), "summarize should include lifecycle context entrypoint.");
assert(summarize.entrypoints.includes("lifecycle/context-matrix.json"), "summarize should include context matrix entrypoint.");
assert(summarize.entrypoints.includes("lifecycle/readiness-tiers.json"), "summarize should include readiness tiers entrypoint.");
assert(summarize.entrypoints.includes("lifecycle/implementation-phases.json"), "summarize should include implementation phases entrypoint.");
assert(summarize.entrypoints.includes("lifecycle/clarification-turn.json"), "summarize should include clarification turn entrypoint.");
assert(summarize.entrypoints.includes("lifecycle/clarification-state.json"), "summarize should include clarification state entrypoint.");
assert(summarize.entrypoints.includes("01-evidence/evidence-ledger.json"), "summarize should include evidence ledger entrypoint.");
assert(summarize.entrypoints.includes("lifecycle/contract-state.json"), "summarize should include contract state entrypoint.");
assert(summarize.entrypoints.includes("draft/frontend-contract.draft.json"), "summarize should include frontend draft entrypoint.");
assert(summarize.entrypoints.includes("governance/non-negotiable-principles.json"), "summarize should include non-negotiable principles entrypoint.");
assert(summarize.entrypoints.includes("governance/evidence-decision-model.json"), "summarize should include evidence decision model entrypoint.");
assert(summarize.entrypoints.includes("governance/forbidden-behaviors.json"), "summarize should include forbidden behavior entrypoint.");
assert(summarize.entrypoints.includes("governance/convergence-standard.json"), "summarize should include convergence standard entrypoint.");
assert(!summarize.entrypoints.includes("spec/archetype-spec.json"), "draft summarize must not include canonical spec entrypoint.");
assert(!summarize.entrypoints.includes("test-first/test-first-contract.json"), "draft summarize must not include test-first entrypoint.");

const validate = runJson(["validate", "--out", outputDir]);
assert(validate.status === "pass", "validate --json should pass.");
assert(validate.checkedFiles > 0, "validate should check manifest artifacts.");

const assumptionLedgerPath = path.join(outputDir, "draft", "assumption-ledger.md");
const assumptionLedger = readFileSync(assumptionLedgerPath, "utf8");
rmSync(assumptionLedgerPath);
const failedValidate = runJsonMaybeFail(["validate", "--out", outputDir]);
assert(failedValidate.exitCode === 1, "validate should exit non-zero when a required artifact is missing.");
assert(failedValidate.json.status === "fail", "validate should report fail when a required artifact is missing.");
assert(
  failedValidate.json.blockers.some((blocker) => String(blocker).includes("draft/assumption-ledger.md")),
  "validate should name the missing draft assumption ledger."
);
writeFileSync(assumptionLedgerPath, assumptionLedger);

const blockedWriteTarget = runJsonMaybeFail(["write-target", "--out", outputDir, "--target", targetDir, "--force"]);
assert(blockedWriteTarget.exitCode === 1, "write-target should reject an unapproved draft package.");
assert(blockedWriteTarget.json.blockers.some((blocker) => String(blocker).includes("Implementation is not authorized")), "write-target should name the approval blocker.");

const approvedIntake = {
  ...JSON.parse(readFileSync(intakePath, "utf8")),
  contractApproval: {
    approved: true,
    approverType: "human",
    approvedBy: "CLI contract test",
    approvedAt: "2026-05-06T00:00:00.000Z",
    artifactRefs: ["spec/archetype-spec.json", "implementation-contract.md", "test-first/test-first-contract.json"]
  }
};
writeFileSync(approvedIntakePath, `${JSON.stringify(approvedIntake, null, 2)}\n`);
const approvedGenerate = runJson(["generate", "--input", approvedIntakePath, "--out", approvedOutputDir]);
assert(approvedGenerate.readyForFrontendAgent === true, "human-approved package should be ready for frontend implementation.");
assert(approvedGenerate.readinessTier === "ready_for_implementation", "human-approved package should be ready for implementation.");
const approvedValidate = runJson(["validate", "--out", approvedOutputDir]);
assert(approvedValidate.status === "pass", "approved validate --json should pass.");
const approvedSummarize = runJson(["summarize", "--out", approvedOutputDir]);
assert(approvedSummarize.entrypoints.includes("test-first/test-quality-standard.json"), "approved summarize should expose the test quality standard.");
assert(approvedSummarize.entrypoints.includes("governance/forbidden-behaviors.json"), "approved summarize should expose the forbidden behavior contract.");
assert(approvedSummarize.entrypoints.includes("governance/convergence-standard.json"), "approved summarize should expose the convergence standard.");
const simulate = runJson(["simulate", "--out", approvedOutputDir]);
assert(["pass", "warning"].includes(simulate.status), "simulate --json should pass or warn.");
assert(simulate.summary.routes === 6, "simulate should report route simulation coverage.");

const writeTarget = runJson(["write-target", "--out", approvedOutputDir, "--target", targetDir, "--force"]);
assert(writeTarget.status === "pass", "write-target --json should pass.");
assert(writeTarget.filesWritten > 0, "write-target should report written files.");

const verifyTarget = runJson(["verify-target", "--out", approvedOutputDir, "--target", targetDir]);
assert(verifyTarget.status === "pass", "verify-target --json should pass.");
assert(verifyTarget.summary.install === "pass", "verify-target should install dependencies.");
assert(verifyTarget.summary.typecheck === "pass", "verify-target should typecheck.");
assert(verifyTarget.summary.build === "pass", "verify-target should build.");
assert(verifyTarget.summary.playwright === "pass", "verify-target should run Playwright verification.");
assert(verifyTarget.repair.status === "pass", "verify-target should write passing repair status.");
assert(verifyTarget.repair.taskCount === 0, "verify-target should have no repair tasks after passing verification.");

const repair = runJson(["repair", "--out", approvedOutputDir, "--target", targetDir]);
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
  outputDir: approvedOutputDir,
  targetDir
};

writeFileSync(path.join(workspace, "cli-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
