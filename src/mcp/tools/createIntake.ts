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

const SOURCE_MATERIAL_TYPES = new Set(["document", "code", "design_file", "screenshot", "brand", "other"]);

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

function sourceMaterialType(value: unknown): SourceMaterialInput["type"] {
  return typeof value === "string" && SOURCE_MATERIAL_TYPES.has(value) ? value as SourceMaterialInput["type"] : "other";
}

function sourceMaterialInputs(value: unknown): SourceMaterialInput[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const record = asRecord(item);
    const pathValue = stringValue(record, "path");
    const label = stringValue(record, "label") || pathValue || `Imported material ${index + 1}`;
    const content = stringValue(record, "content");
    const notes = stringValue(record, "notes");
    return {
      id: stringValue(record, "id") || undefined,
      label,
      type: sourceMaterialType(record.type),
      content: content || undefined,
      notes: notes || undefined,
      path: pathValue || undefined
    };
  }).filter((material) => material.label && (material.content || material.notes || material.path));
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
      },
      materials: {
        type: "array",
        description: "Optional source materials imported by the agent from @files, screenshots, repo paths, design notes, or attached context.",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            label: { type: "string" },
            type: { type: "string", enum: ["document", "code", "design_file", "screenshot", "brand", "other"] },
            content: { type: "string" },
            notes: { type: "string" },
            path: { type: "string" }
          },
          required: ["label", "type"]
        }
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
    const importedMaterials = sourceMaterialInputs(record.materials);

    const missingInputs = [
      !targetStack ? "targetStack" : "",
      !brandNotes ? "brandNotes" : "",
      !existingRepoContext && importedMaterials.length === 0 ? "existingRepoContext or materials" : ""
    ].filter(Boolean);
    const riskFlags = [
      !targetStack ? "Target stack was not provided; generated contracts will remain framework-agnostic." : "",
      !existingRepoContext && importedMaterials.length === 0 ? "No existing repository context or imported source materials were provided; migration constraints may be incomplete." : "",
      !brandNotes ? "No brand notes were provided; visual direction will be inferred from the brief." : ""
    ].filter(Boolean);

    const materials: SourceMaterialInput[] = [...importedMaterials];
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
      importedMaterials.length > 0
        ? `Imported @ materials:\n${importedMaterials.map((material) => `- ${material.label} (${material.type})${material.path ? ` at ${material.path}` : ""}${material.notes ? `: ${material.notes}` : ""}`).join("\n")}`
        : "",
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
      materials: materials.length,
      nextTool: "archetype_generate_package"
    };
  }
};
