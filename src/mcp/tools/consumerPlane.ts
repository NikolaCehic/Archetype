import { readConsumerPlane } from "../../consumer-plane";
import {
  asRecord,
  resolveDeclaredPath,
  type JsonRecord,
  type McpToolDefinition
} from "./shared";

export const consumerPlaneTool: McpToolDefinition = {
  name: "archetype_consumer_next_action",
  description: "Return the compact consumer-plane contract: what the host should say, read, avoid, and do next.",
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
    return { ...readConsumerPlane(outputDir) };
  }
};
