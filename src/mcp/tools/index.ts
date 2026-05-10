import { answerClarificationTool } from "./answerClarification";
import { createIntakeTool } from "./createIntake";
import { consumerPlaneTool } from "./consumerPlane";
import {
  dataPlaneArtifactsTool,
  dataPlaneLifecycleTool,
  dataPlaneReadArtifactTool,
  dataPlaneReplayRunTool,
  dataPlaneStatusTool,
  dataPlaneTimelineTool
} from "./dataPlane";
import { generatePackageTool } from "./generatePackage";
import { planRepairTool } from "./planRepair";
import { phasePackageTool } from "./phasePackage";
import { readArtifactTool } from "./readArtifact";
import { releaseDoctorTool } from "./releaseDoctor";
import { reviewDecisionTool } from "./reviewDecision";
import { runLifecycleTool } from "./runLifecycle";
import { summarizePackageTool } from "./summarizePackage";
import { validatePackageTool } from "./validatePackage";
import { verifyTargetTool } from "./verifyTarget";
import type { McpToolDefinition } from "./shared";

export const archetypeMcpTools: McpToolDefinition[] = [
  releaseDoctorTool,
  runLifecycleTool,
  createIntakeTool,
  answerClarificationTool,
  generatePackageTool,
  consumerPlaneTool,
  reviewDecisionTool,
  phasePackageTool,
  dataPlaneStatusTool,
  dataPlaneTimelineTool,
  dataPlaneArtifactsTool,
  dataPlaneReadArtifactTool,
  dataPlaneLifecycleTool,
  dataPlaneReplayRunTool,
  validatePackageTool,
  summarizePackageTool,
  readArtifactTool,
  verifyTargetTool,
  planRepairTool
];

export const archetypeMcpToolNames = archetypeMcpTools.map((tool) => tool.name);
