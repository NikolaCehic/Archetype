import { validateExportedPackage } from "../../quality/validatePackage";
import {
  asRecord,
  resolveDeclaredPath,
  type JsonRecord,
  type McpToolDefinition
} from "./shared";

export const validatePackageTool: McpToolDefinition = {
  name: "archetype_validate_package",
  description: "Validate a generated Archetype output package and return blockers, warnings, and checked file count.",
  inputSchema: {
    type: "object",
    properties: {
      outputDir: {
        type: "string",
        description: "Generated archetype-output directory."
      }
    },
    required: ["outputDir"]
  },
  run(args: unknown): JsonRecord {
    const record = asRecord(args);
    const outputDir = resolveDeclaredPath(record.outputDir, "archetype-output", "outputDir");
    const result = validateExportedPackage(outputDir);
    return {
      status: result.status,
      outputDir: result.outputDir,
      checkedFiles: result.checkedFiles,
      errors: result.blockers,
      blockers: result.blockers,
      warnings: result.warnings
    };
  }
};
