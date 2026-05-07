import { execFileSync, spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "mcp-contract");
const intakePath = path.join(workspace, "archetype.intake.json");
const outputDir = path.join(workspace, "archetype-output");
const approvedIntakePath = path.join(workspace, "archetype.approved.intake.json");
const approvedOutputDir = path.join(workspace, "archetype-approved-output");
const targetDir = path.join(workspace, "generated-frontend");
const weakIntakePath = path.join(workspace, "weak.intake.json");
const weakAnsweredPath = path.join(workspace, "weak.answered.intake.json");

rmSync(workspace, { recursive: true, force: true });
mkdirSync(workspace, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const child = spawn("node", ["dist/mcp/server.js"], {
  cwd: root,
  stdio: ["pipe", "pipe", "pipe"]
});

let nextId = 1;
let stdoutBuffer = "";
let stderrBuffer = "";
const pending = new Map();

child.stdout.on("data", (chunk) => {
  stdoutBuffer += chunk.toString("utf8");
  while (stdoutBuffer.includes("\n")) {
    const index = stdoutBuffer.indexOf("\n");
    const line = stdoutBuffer.slice(0, index);
    stdoutBuffer = stdoutBuffer.slice(index + 1);
    if (!line.trim()) continue;
    let message;
    try {
      message = JSON.parse(line);
    } catch (error) {
      throw new Error(`MCP server returned non-JSON output: ${line}\n${error}`);
    }
    const waiter = pending.get(message.id);
    if (!waiter) continue;
    pending.delete(message.id);
    clearTimeout(waiter.timeout);
    if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
    else waiter.resolve(message.result);
  }
});

child.stderr.on("data", (chunk) => {
  stderrBuffer += chunk.toString("utf8");
});

child.on("exit", (code, signal) => {
  for (const [id, waiter] of pending) {
    clearTimeout(waiter.timeout);
    waiter.reject(new Error(`MCP server exited before response ${id}. code=${code} signal=${signal}\n${stderrBuffer}`));
  }
  pending.clear();
});

function request(method, params = {}, timeoutMs = 240000) {
  const id = nextId++;
  const payload = { jsonrpc: "2.0", id, method, params };
  const promise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}.\n${stderrBuffer}`));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timeout });
  });
  child.stdin.write(`${JSON.stringify(payload)}\n`);
  return promise;
}

function notify(method, params = {}) {
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
}

function extractToolPayload(result) {
  if (result.isError) {
    const text = result.content?.[0]?.text ?? JSON.stringify(result);
    throw new Error(`MCP tool returned an error: ${text}`);
  }
  if (result.structuredContent) return result.structuredContent;
  const text = result.content?.[0]?.text;
  if (!text) throw new Error(`MCP tool returned no content: ${JSON.stringify(result)}`);
  return JSON.parse(text);
}

async function callTool(name, args, timeoutMs = 240000) {
  return extractToolPayload(await request("tools/call", { name, arguments: args }, timeoutMs));
}

async function expectToolError(name, args, timeoutMs = 240000) {
  const result = await request("tools/call", { name, arguments: args }, timeoutMs);
  assert(result.isError === true, `${name} should return an MCP tool error.`);
  const text = result.content?.[0]?.text ?? "{}";
  return JSON.parse(text);
}

try {
  const init = await request("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "archetype-mcp-contract", version: "0.1.0" }
  });
  assert(init.serverInfo?.name === "archetype-mcp", "initialize should return Archetype server info.");
  assert(init.capabilities?.tools, "initialize should advertise tools capability.");
  notify("notifications/initialized");

  const listed = await request("tools/list");
  const names = new Set((listed.tools ?? []).map((tool) => tool.name));
  for (const required of [
    "archetype_release_doctor",
    "archetype_create_intake",
    "archetype_answer_clarification",
    "archetype_generate_package",
    "archetype_validate_package",
    "archetype_summarize_package",
    "archetype_read_artifact",
    "archetype_verify_target",
    "archetype_plan_repair"
  ]) {
    assert(names.has(required), `tools/list is missing ${required}.`);
  }

  const releaseDoctor = await callTool("archetype_release_doctor", {});
  assert(releaseDoctor.status === "pass", "release doctor should pass through MCP.");
  assert(releaseDoctor.quickstart?.published_package?.some((command) => String(command).includes("archetype install --target all --json")), "release doctor should expose one-command plugin install.");
  assert(releaseDoctor.docs?.some((doc) => doc.path === "docs/agent-lifecycle.md"), "release doctor should expose lifecycle docs.");

  writeFileSync(weakIntakePath, `${JSON.stringify({
    projectName: "Marketing Admin",
    context: "I want to build a admin dashboard for a marketing team",
    operatingMode: "full_architecture"
  }, null, 2)}\n`);
  const answerClarification = await callTool("archetype_answer_clarification", {
    inputPath: weakIntakePath,
    outputPath: weakAnsweredPath,
    questionId: "primary_users",
    answer: "Marketing operations manager",
    answeredBy: "mcp-contract"
  });
  assert(answerClarification.status === "warning", "answer clarification should update weak intake while more context remains missing.");
  assert(answerClarification.nextQuestionId === "target_stack", "answer clarification should return the next one-question blocker.");
  assert(answerClarification.clarificationTurn?.question_count === 1, "answer clarification should return one current question.");

  const createIntake = await callTool("archetype_create_intake", {
    projectName: "SignalDesk",
    brief: "Build a dense premium B2B SaaS analytics dashboard for marketing teams with onboarding, workspace selection, campaign overview, report builder, billing, and settings.",
    targetStack: "React, TypeScript, Next.js App Router, Tailwind CSS",
    brandNotes: "Premium, dense, dark, enterprise, direct, operational.",
    existingRepoContext: "The target frontend should be deterministic and should not invent routes or screen states.",
    dataBoundary: {
      mode: "mock",
      dataSource: "Local deterministic fixtures for campaigns, workspaces, billing, reports, and settings.",
      auth: "Mock authenticated workspace user.",
      permissions: "Marketing manager, growth analyst, and workspace admin permissions represented in frontend state.",
      notes: "No production backend integration is required for the generated frontend contract."
    },
    testExecution: {
      playwrightAllowed: true,
      commandsAllowed: true,
      testTypes: ["smoke", "e2e", "ui", "integration", "unit", "accessibility"],
      notes: "Generate test-first obligations and Playwright verification scenarios before implementation."
    },
    assumptionApproval: {
      approvedForDraft: true,
      approvedBy: "mcp-contract",
      notes: "Archetype may propose candidate assumptions for draft artifacts while keeping them non-canonical until human approval."
    },
    safetyConstraints: [
      "Use mock billing and analytics data only.",
      "Do not make financial, compliance, or production integration claims."
    ],
    outputPath: intakePath,
    users: ["Marketing manager", "Growth analyst", "Workspace admin"],
    materials: [
      {
        label: "@docs/product-brief.md",
        type: "document",
        path: "docs/product-brief.md",
        content: "Analytics dashboard brief with onboarding, workspace switching, campaign reporting, and settings.",
        notes: "Imported from an @file mention."
      },
      {
        label: "@screens/dashboard.png",
        type: "screenshot",
        path: "screens/dashboard.png",
        notes: "Dense dark dashboard screenshot with sidebar, metric cards, charts, tables, and filter controls."
      }
    ],
    goals: [
      "Generate a deterministic frontend implementation contract.",
      "Expose route, screen, design-system, and verification artifacts for coding agents."
    ]
  });
  assert(["success", "warning"].includes(createIntake.status), "create intake should succeed or warn.");
  assert(createIntake.intakePath === intakePath, "create intake should report the written intake path.");
  assert(existsSync(intakePath), "create intake should write intake JSON.");
  assert(createIntake.materials >= 4, "create intake should preserve imported @file materials plus derived context materials.");
  const createdIntake = JSON.parse(readFileSync(intakePath, "utf8"));
  assert(createdIntake.materials.some((material) => material.label === "@screens/dashboard.png"), "intake should include imported screenshot material.");

  const unsafeGenerate = await expectToolError("archetype_generate_package", {
    inputPath: intakePath,
    outputDir: root,
    overwrite: true
  });
  assert(
    unsafeGenerate.message.includes("dedicated output directory") || unsafeGenerate.message.includes("existing project directory"),
    "generate should reject unsafe output directories."
  );

  const generate = await callTool("archetype_generate_package", {
    inputPath: intakePath,
    outputDir,
    overwrite: true
  });
  assert(["success", "warning"].includes(generate.status), "generate should succeed or warn.");
  assert(generate.packageType === "draft_contract", "generated draft package should identify draft_contract.");
  assert(generate.readyForFrontendAgent === false, "generated draft package should not be implementation-ready before human contract approval.");
  assert(generate.readinessTier === "ready_for_contract_approval", "generated draft package should be waiting for contract approval.");
  assert(generate.blockers.some((blocker) => blocker.includes("canonical contract is not approved by a human reviewer")), "MCP generate should expose the human approval implementation gate.");
  assert(generate.artifacts.some((artifact) => artifact.id === "frontend-contract-draft"), "generate should return frontend draft artifact.");

  const validate = await callTool("archetype_validate_package", { outputDir });
  assert(validate.status === "pass", "validate should pass.");
  assert(validate.checkedFiles > 0, "validate should check files.");

  const summarize = await callTool("archetype_summarize_package", { outputDir });
  assert(summarize.product === "SignalDesk", "summarize should include product name.");
  assert(summarize.routes > 0, "summarize should include route count.");
  assert(summarize.screens > 0, "summarize should include screen count.");
  assert(summarize.entrypoints.includes("lifecycle/readiness-tiers.json"), "summarize should include readiness tiers entrypoint.");
  assert(summarize.entrypoints.includes("lifecycle/implementation-phases.json"), "summarize should include implementation phases entrypoint.");
  assert(summarize.entrypoints.includes("lifecycle/contract-state.json"), "summarize should include contract state entrypoint.");
  assert(summarize.entrypoints.includes("draft/frontend-contract.draft.json"), "summarize should include frontend draft entrypoint.");
  assert(!summarize.entrypoints.includes("test-first/test-first-contract.json"), "draft summarize should not include test-first contract entrypoint.");
  assert(summarize.entrypoints.includes("governance/non-negotiable-principles.json"), "summarize should include non-negotiable principles entrypoint.");
  assert(summarize.entrypoints.includes("governance/evidence-decision-model.json"), "summarize should include evidence decision model entrypoint.");
  assert(summarize.entrypoints.includes("governance/forbidden-behaviors.json"), "summarize should include forbidden behavior entrypoint.");
  assert(summarize.entrypoints.includes("governance/convergence-standard.json"), "summarize should include convergence standard entrypoint.");

  const artifact = await callTool("archetype_read_artifact", {
    outputDir,
    artifactId: "frontend-contract-draft"
  });
  assert(artifact.status === "success", "read artifact should succeed.");
  assert(artifact.content.includes("agent_instruction_policy"), "read artifact should return frontend contract draft content.");

  const blockedWriteTarget = spawnSync("node", ["dist/cli.js", "write-target", "--out", outputDir, "--target", targetDir, "--force", "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  const blockedWriteJson = JSON.parse(blockedWriteTarget.stdout);
  assert(blockedWriteTarget.status === 1, "unapproved write-target should exit non-zero.");
  assert(blockedWriteJson.status === "fail", "write-target should fail for an unapproved MCP draft package.");

  const approvedIntake = {
    ...createdIntake,
    contractApproval: {
      approved: true,
      approverType: "human",
      approvedBy: "MCP contract test",
      approvedAt: "2026-05-06T00:00:00.000Z",
      artifactRefs: ["spec/archetype-spec.json", "implementation-contract.md", "test-first/test-first-contract.json"]
    }
  };
  writeFileSync(approvedIntakePath, `${JSON.stringify(approvedIntake, null, 2)}\n`);
  const approvedGenerate = await callTool("archetype_generate_package", {
    inputPath: approvedIntakePath,
    outputDir: approvedOutputDir,
    overwrite: true
  });
  assert(approvedGenerate.readyForFrontendAgent === true, "human-approved MCP package should be ready for frontend implementation.");
  assert(approvedGenerate.readinessTier === "ready_for_implementation", "human-approved MCP package should be ready for implementation.");
  const approvedSummarize = await callTool("archetype_summarize_package", { outputDir: approvedOutputDir });
  assert(approvedSummarize.entrypoints.includes("test-first/test-quality-standard.json"), "approved MCP summarize should expose the test quality standard.");
  assert(approvedSummarize.entrypoints.includes("governance/forbidden-behaviors.json"), "approved MCP summarize should expose the forbidden behavior contract.");
  assert(approvedSummarize.entrypoints.includes("governance/convergence-standard.json"), "approved MCP summarize should expose the convergence standard.");

  execFileSync("node", ["dist/cli.js", "write-target", "--out", approvedOutputDir, "--target", targetDir, "--force"], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"]
  });
  const verify = await callTool("archetype_verify_target", {
    outputDir: approvedOutputDir,
    targetDir,
    skipInstall: false
  }, 360000);
  assert(["pass", "warning"].includes(verify.status), "verify target should pass or warn.");
  assert(verify.summary?.typecheck === "pass", "verify target should typecheck.");
  assert(verify.summary?.build === "pass", "verify target should build.");
  assert(verify.summary?.playwright === "pass", "verify target should run Playwright verification.");
  assert(verify.repair?.status === "pass", "verify target should write passing repair status.");

  const repair = await callTool("archetype_plan_repair", {
    outputDir: approvedOutputDir,
    targetDir
  });
  assert(repair.status === "pass", "repair planning should pass after successful verification.");
  assert(repair.taskCount === 0, "repair planning should have no tasks after successful verification.");

  const summary = {
    status: "pass",
    tools: [...names].sort(),
    outputDir,
    targetDir,
    verifyStatus: verify.status
  };
  writeFileSync(path.join(workspace, "mcp-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
} finally {
  child.kill();
}
