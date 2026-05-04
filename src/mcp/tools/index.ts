import { createIntakeTool } from "./createIntake";
import { generatePackageTool } from "./generatePackage";
import { planRepairTool } from "./planRepair";
import { readArtifactTool } from "./readArtifact";
import { summarizePackageTool } from "./summarizePackage";
import { validatePackageTool } from "./validatePackage";
import { verifyTargetTool } from "./verifyTarget";
import type { McpToolDefinition } from "./shared";

export const archetypeMcpTools: McpToolDefinition[] = [
  createIntakeTool,
  generatePackageTool,
  validatePackageTool,
  summarizePackageTool,
  readArtifactTool,
  verifyTargetTool,
  planRepairTool
];

export const archetypeMcpToolNames = archetypeMcpTools.map((tool) => tool.name);
