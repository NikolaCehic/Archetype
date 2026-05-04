import type { ArchetypeInput, FrontendStackInput, SourceMaterialInput } from "../../core/types";
import {
  arrayValue,
  asRecord,
  resolveDeclaredPath,
  stringValue,
  writeJsonFile,
  type JsonRecord,
  type McpToolDefinition
} from "./shared";

function inferStack(targetStack: string): FrontendStackInput {
  const normalized = targetStack.toLowerCase();
  const stack: FrontendStackInput = {};
  if (normalized.includes("next")) {
    stack.framework = "React";
    stack.routing = "Next.js App Router";
  } else if (normalized.includes("react")) {
    stack.framework = "React";
    stack.routing = normalized.includes("router") ? "React Router" : "App router chosen by target project";
  } else if (normalized.includes("vue")) {
    stack.framework = "Vue";
  } else if (normalized.includes("svelte")) {
    stack.framework = "Svelte";
  }

  if (normalized.includes("typescript") || normalized.includes("ts")) stack.language = "TypeScript";
  if (normalized.includes("tailwind")) stack.styling = "Tailwind CSS + CSS variables";
  else if (normalized.includes("css")) stack.styling = "CSS variables";
  return stack;
}

function brandAttributes(brandNotes: string): string[] {
  return brandNotes
    .split(/[,.;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export const createIntakeTool: McpToolDefinition = {
  name: "archetype_create_intake",
  description: "Create or update an Archetype intake file from product context for deterministic contract generation.",
  inputSchema: {
    type: "object",
    properties: {
      brief: {
        type: "string",
        description: "Product or feature brief. This becomes the primary context for contract generation."
      },
      targetStack: {
        type: "string",
        description: "Frontend stack notes such as React, Next.js, TypeScript, Tailwind, or routing constraints."
      },
      brandNotes: {
        type: "string",
        description: "Brand tone, density, palette, typography, or visual direction notes."
      },
      existingRepoContext: {
        type: "string",
        description: "Important existing repo context, screenshots, routes, components, constraints, or migration notes."
      },
      outputPath: {
        type: "string",
        description: "Where to write the intake JSON file. Defaults to archetype.intake.json."
      },
      projectName: {
        type: "string",
        description: "Optional product name."
      },
      goals: {
        type: "array",
        items: { type: "string" },
        description: "Optional explicit product or implementation goals."
      },
      users: {
        type: "array",
        items: { type: "string" },
        description: "Optional target user roles."
      }
    },
    required: ["brief"]
  },
  run(args: unknown): JsonRecord {
    const record = asRecord(args);
    const brief = stringValue(record, "brief");
    if (!brief) throw new Error("brief is required.");

    const targetStack = stringValue(record, "targetStack");
    const brandNotes = stringValue(record, "brandNotes");
    const existingRepoContext = stringValue(record, "existingRepoContext");
    const outputPath = resolveDeclaredPath(record.outputPath, "archetype.intake.json", "outputPath");
    const goals = arrayValue(record, "goals");
    const users = arrayValue(record, "users");

    const missingInputs = [
      !targetStack ? "targetStack" : "",
      !brandNotes ? "brandNotes" : "",
      !existingRepoContext ? "existingRepoContext" : ""
    ].filter(Boolean);
    const riskFlags = [
      !targetStack ? "Target stack was not provided; generated contracts will remain framework-agnostic." : "",
      !existingRepoContext ? "No existing repository context was provided; migration constraints may be incomplete." : "",
      !brandNotes ? "No brand notes were provided; visual direction will be inferred from the brief." : ""
    ].filter(Boolean);

    const materials: SourceMaterialInput[] = [];
    if (existingRepoContext) {
      materials.push({
        id: "existing_repo_context",
        label: "Existing repository context",
        type: "code",
        content: existingRepoContext,
        notes: "Provided through archetype_create_intake."
      });
    }
    if (targetStack) {
      materials.push({
        id: "target_stack",
        label: "Target frontend stack",
        type: "document",
        content: targetStack,
        notes: "Provided through archetype_create_intake."
      });
    }

    const context = [
      brief,
      brandNotes ? `Brand notes: ${brandNotes}` : "",
      existingRepoContext ? `Existing repo context: ${existingRepoContext}` : "",
      targetStack ? `Target stack: ${targetStack}` : ""
    ].filter(Boolean).join("\n\n");

    const intake: ArchetypeInput = {
      projectName: stringValue(record, "projectName") || undefined,
      context,
      goals: goals.length > 0 ? goals : ["Generate a deterministic frontend implementation contract for AI coding agents."],
      users,
      brand: brandNotes
        ? {
            attributes: brandAttributes(brandNotes),
            tone: brandNotes
          }
        : undefined,
      stack: targetStack ? inferStack(targetStack) : undefined,
      operatingMode: "full_architecture",
      materials
    };

    writeJsonFile(outputPath, intake);

    return {
      status: missingInputs.length > 0 ? "warning" : "success",
      intakePath: outputPath,
      missingInputs,
      riskFlags,
      nextTool: "archetype_generate_package"
    };
  }
};
