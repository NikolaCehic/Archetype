import { verifyTargetFrontendExecution } from "../../output/verifyTargetFrontend";
import {
  asRecord,
  booleanValue,
  resolveDeclaredPath,
  type JsonRecord,
  type McpToolDefinition
} from "./shared";

export const verifyTargetTool: McpToolDefinition = {
  name: "archetype_verify_target",
  description: "Verify a target frontend against a generated Archetype contract package.",
  inputSchema: {
    type: "object",
    properties: {
      outputDir: {
        type: "string",
        description: "Generated archetype-output directory."
      },
      targetDir: {
        type: "string",
        description: "Target frontend repository or generated scaffold directory."
      },
      skipInstall: {
        type: "boolean",
        description: "Defaults to true for MCP safety. Pass false only with explicit user or host permission to run npm install."
      }
    },
    required: ["outputDir", "targetDir"]
  },
  run(args: unknown): JsonRecord {
    const record = asRecord(args);
    const outputDir = resolveDeclaredPath(record.outputDir, "archetype-output", "outputDir");
    const targetDir = resolveDeclaredPath(record.targetDir, "", "targetDir");
    const skipInstall = booleanValue(record, "skipInstall", true);
    const result = verifyTargetFrontendExecution(outputDir, targetDir, { skipInstall });
    const status = result.status === "fail" ? "fail" : result.warnings.length > 0 ? "warning" : "pass";

    return {
      status,
      outputDir: result.output_dir,
      targetDir: result.target_dir,
      checks: result.commands.map((command) => ({
        name: command.id,
        command: command.command,
        status: command.status,
        message: command.status === "pass" ? "passed" : command.stderr || command.stdout || "failed"
      })),
      summary: result.summary,
      blockers: result.blockers,
      warnings: result.warnings,
      proofArtifacts: result.proof_artifacts
    };
  }
};
