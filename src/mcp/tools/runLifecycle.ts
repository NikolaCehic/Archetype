import type { SourceMaterialType } from "../../core/types";
import { runLifecycle, type RunLifecycleMaterialInput } from "../../lifecycle/runLifecycle";
import {
  arrayValue,
  asRecord,
  booleanValue,
  stringValue,
  type JsonRecord,
  type McpToolDefinition
} from "./shared";

const MATERIAL_TYPES = new Set(["document", "code", "design_file", "screenshot", "brand", "other"]);

function sourceMaterialType(value: unknown): SourceMaterialType | undefined {
  return typeof value === "string" && MATERIAL_TYPES.has(value) ? value as SourceMaterialType : undefined;
}

function materialInputs(value: unknown): RunLifecycleMaterialInput[] {
  if (!Array.isArray(value)) return [];
  return value.map((item): RunLifecycleMaterialInput => {
    const record = asRecord(item);
    return {
      path: stringValue(record, "path") || undefined,
      label: stringValue(record, "label") || undefined,
      type: sourceMaterialType(record.type),
      content: stringValue(record, "content") || undefined,
      notes: stringValue(record, "notes") || undefined
    };
  }).filter((item) => Boolean(item.path || item.content || item.notes));
}

export const runLifecycleTool: McpToolDefinition = {
  name: "archetype_run_lifecycle",
  description: "Run the deterministic natural-language Archetype lifecycle primitive from brief intake through clarification, draft review, approval, and canonical continuation.",
  inputSchema: {
    type: "object",
    properties: {
      brief: {
        type: "string",
        description: "Natural-language product idea, brief, or direction."
      },
      inputPath: {
        type: "string",
        description: "Existing or new Archetype intake JSON path. Defaults to archetype.intake.json."
      },
      outputDir: {
        type: "string",
        description: "Generated Archetype output directory. Defaults to archetype-output."
      },
      materialPaths: {
        type: "array",
        items: { type: "string" },
        description: "Optional @file or @folder paths to safely ingest and hash."
      },
      materials: {
        type: "array",
        description: "Optional inline or path-backed materials gathered by the host agent.",
        items: {
          type: "object",
          properties: {
            path: { type: "string" },
            label: { type: "string" },
            type: { type: "string", enum: ["document", "code", "design_file", "screenshot", "brand", "other"] },
            content: { type: "string" },
            notes: { type: "string" }
          }
        }
      },
      questionId: {
        type: "string",
        description: "Clarification question id being answered."
      },
      answer: {
        type: "string",
        description: "Single clarification answer."
      },
      approve: {
        type: "boolean",
        description: "Approve the current draft package and continue to canonical generation."
      },
      approvedBy: {
        type: "string",
        description: "Human reviewer name for bound draft approval."
      },
      approvedInputPath: {
        type: "string",
        description: "Where to write the approved intake. Defaults beside inputPath."
      },
      approvedAssumptionIds: {
        type: "array",
        items: { type: "string" },
        description: "Approved draft assumption ids."
      },
      projectName: {
        type: "string",
        description: "Optional product name when creating a new intake from a brief."
      },
      overwrite: {
        type: "boolean",
        description: "Whether Archetype may replace a marked generated output directory. Defaults to true."
      }
    }
  },
  run(args: unknown): JsonRecord {
    const record = asRecord(args);
    const result = runLifecycle({
      brief: stringValue(record, "brief") || undefined,
      inputPath: stringValue(record, "inputPath") || undefined,
      outputDir: stringValue(record, "outputDir") || undefined,
      materialPaths: arrayValue(record, "materialPaths"),
      materials: materialInputs(record.materials),
      questionId: stringValue(record, "questionId") || undefined,
      answer: stringValue(record, "answer") || undefined,
      approve: booleanValue(record, "approve", false),
      approvedBy: stringValue(record, "approvedBy") || undefined,
      approvedInputPath: stringValue(record, "approvedInputPath") || undefined,
      approvedAssumptionIds: arrayValue(record, "approvedAssumptionIds"),
      projectName: stringValue(record, "projectName") || undefined,
      overwrite: booleanValue(record, "overwrite", true),
      host: "mcp"
    });
    return { ...result };
  }
};
