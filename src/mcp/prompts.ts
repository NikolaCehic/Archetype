import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { asRecord, resolveDeclaredPath, type JsonRecord } from "./tools/shared";
import { packageResourceUri } from "./resources";

interface McpPrompt {
  name: string;
  description: string;
  arguments: Array<{ name: string; description: string; required: boolean }>;
}

const PROMPTS: McpPrompt[] = [
  {
    name: "archetype_current_phase",
    description: "Use the consumer plane and review session to explain the current phase and next legal action.",
    arguments: [{ name: "outputDir", description: "Generated archetype-output directory.", required: true }]
  },
  {
    name: "archetype_review_draft",
    description: "Present draft preview, route proposals, source materials, blockers, and approval decisions.",
    arguments: [{ name: "outputDir", description: "Generated draft archetype-output directory.", required: true }]
  },
  {
    name: "archetype_tests_first_handoff",
    description: "Start implementation by reading only tests-first and implementation phase artifacts.",
    arguments: [{ name: "outputDir", description: "Generated canonical archetype-output directory.", required: true }]
  }
];

function readJsonText(outputDir: string, relativePath: string): string {
  const filePath = path.join(outputDir, relativePath);
  if (!existsSync(filePath)) throw new Error(`Prompt context is missing required artifact: ${relativePath}`);
  return readFileSync(filePath, "utf8");
}

function promptText(name: string, outputDir: string): string {
  const consumer = readJsonText(outputDir, "agent-context/consumer-plane.json");
  const review = readJsonText(outputDir, "review-console/session.json");
  const lazyIndexUri = packageResourceUri(outputDir, "progressive/lazy-contract-index.json");
  if (name === "archetype_review_draft") {
    return [
      "Present the Archetype draft review as decisions, not as a file dump.",
      "Use the review console, design-system preview, route proposals, source-material status, blockers, and approval checklist.",
      "Ask for approval or specific edits. Do not implement from a draft package.",
      "",
      `Lazy contract index resource: ${lazyIndexUri}`,
      "",
      "Consumer plane:",
      consumer,
      "",
      "Review session:",
      review
    ].join("\n");
  }
  if (name === "archetype_tests_first_handoff") {
    return [
      "Begin the canonical handoff with tests first.",
      "Read only the consumer plane, test-first bundle, implementation bundle, and artifacts named by those bundles.",
      "Preserve the initial red test result before writing product UI.",
      "",
      `Lazy contract index resource: ${lazyIndexUri}`,
      "",
      "Consumer plane:",
      consumer,
      "",
      "Review session:",
      review
    ].join("\n");
  }
  return [
    "Explain the current Archetype phase and next legal action.",
    "Do not ask the user to run internal CLI commands.",
    "Do not inspect broad artifacts unless the consumer plane and current phase bundle allow it.",
    "",
    `Lazy contract index resource: ${lazyIndexUri}`,
    "",
    "Consumer plane:",
    consumer,
    "",
    "Review session:",
    review
  ].join("\n");
}

export function listMcpPrompts(): JsonRecord {
  return { prompts: PROMPTS };
}

export function getMcpPrompt(params: unknown): JsonRecord {
  const record = asRecord(params);
  const name = typeof record.name === "string" ? record.name : "";
  const prompt = PROMPTS.find((item) => item.name === name);
  if (!prompt) throw new Error(`Unknown prompt "${name}". Known prompts: ${PROMPTS.map((item) => item.name).join(", ")}`);
  const args = asRecord(record.arguments);
  const outputDir = resolveDeclaredPath(args.outputDir, "", "outputDir");
  return {
    description: prompt.description,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: promptText(name, outputDir)
        }
      }
    ]
  };
}
