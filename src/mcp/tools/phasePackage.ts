import { createPhasePackage } from "../../progressive";
import type { AgentContextPhaseId } from "../../agent-context/phaseBundles";
import {
  asRecord,
  booleanValue,
  resolveDeclaredPath,
  stringValue,
  type JsonRecord,
  type McpToolDefinition
} from "./shared";

export const phasePackageTool: McpToolDefinition = {
  name: "archetype_phase_package",
  description: "Create a small phase-scoped handoff package from an existing Archetype output directory.",
  inputSchema: {
    type: "object",
    properties: {
      outputDir: {
        type: "string",
        description: "Generated archetype-output directory."
      },
      targetDir: {
        type: "string",
        description: "Directory where the phase package should be written."
      },
      phase: {
        type: "string",
        description: "Lifecycle phase id, such as draft_review, test_first, implementation, verification, qa, or repair."
      },
      overwrite: {
        type: "boolean",
        description: "Allow replacing a marked generated phase package directory."
      }
    },
    required: ["outputDir", "targetDir", "phase"]
  },
  run(args: unknown): JsonRecord {
    const record = asRecord(args);
    const outputDir = resolveDeclaredPath(record.outputDir, "archetype-output", "outputDir");
    const targetDir = resolveDeclaredPath(record.targetDir, "archetype-phase-package", "targetDir");
    const phase = stringValue(record, "phase") as AgentContextPhaseId;
    if (!phase) throw new Error("phase is required.");
    return { ...createPhasePackage({
      sourceOutputDir: outputDir,
      targetDir,
      phaseId: phase,
      force: booleanValue(record, "overwrite", false)
    }) };
  }
};
