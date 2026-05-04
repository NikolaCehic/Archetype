import { updateRepairArtifactsFromLatest } from "../../modules/revisionProtocol";
import {
  asRecord,
  resolveDeclaredPath,
  type JsonRecord,
  type McpToolDefinition
} from "./shared";

export const planRepairTool: McpToolDefinition = {
  name: "archetype_plan_repair",
  description: "Generate concrete repair or revision tasks from the latest target verification evidence.",
  inputSchema: {
    type: "object",
    properties: {
      outputDir: {
        type: "string",
        description: "Generated archetype-output directory."
      },
      targetDir: {
        type: "string",
        description: "Optional target frontend directory used to read Playwright result evidence."
      }
    },
    required: ["outputDir"]
  },
  run(args: unknown): JsonRecord {
    const record = asRecord(args);
    const outputDir = resolveDeclaredPath(record.outputDir, "archetype-output", "outputDir");
    const targetDir = typeof record.targetDir === "string" && record.targetDir.trim().length > 0
      ? resolveDeclaredPath(record.targetDir, "", "targetDir")
      : null;
    const result = updateRepairArtifactsFromLatest(outputDir, targetDir);
    return {
      status: result.status,
      outputDir: result.outputDir,
      targetDir: result.targetDir,
      taskCount: result.taskCount,
      artifacts: result.artifacts,
      blockers: result.blockers,
      warnings: result.warnings
    };
  }
};
