import { buildPackageSummary, type PackageSummaryMode } from "../../agent-context/packageSummary";
import {
  asRecord,
  resolveDeclaredPath,
  stringValue,
  type JsonRecord,
  type McpToolDefinition
} from "./shared";

function summaryMode(record: JsonRecord): PackageSummaryMode {
  const value = stringValue(record, "mode");
  return value === "compat" ? "compat" : "compact";
}

export const summarizePackageTool: McpToolDefinition = {
  name: "archetype_summarize_package",
  description: "Return compact product, route, screen, readiness, blocker, warning, and phase-bundle context for an agent.",
  inputSchema: {
    type: "object",
    properties: {
      outputDir: {
        type: "string",
        description: "Generated archetype-output directory."
      },
      mode: {
        type: "string",
        description: "Optional summary mode. Use compact for token-bounded phase bundles or compat for legacy full entrypoints."
      }
    },
    required: ["outputDir"]
  },
  run(args: unknown): JsonRecord {
    const record = asRecord(args);
    const outputDir = resolveDeclaredPath(record.outputDir, "archetype-output", "outputDir");
    return buildPackageSummary(outputDir, summaryMode(record));
  }
};
