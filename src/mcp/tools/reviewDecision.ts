import { submitReviewDecision, type ReviewDecisionKind } from "../../review";
import {
  arrayValue,
  asRecord,
  booleanValue,
  resolveDeclaredPath,
  stringValue,
  type JsonRecord,
  type McpToolDefinition
} from "./shared";

function reviewDecision(value: string): ReviewDecisionKind {
  if (value === "approve" || value === "request_changes" || value === "reject") return value;
  throw new Error('decision must be one of "approve", "request_changes", or "reject".');
}

export const reviewDecisionTool: McpToolDefinition = {
  name: "archetype_submit_review",
  description: "Submit a human review decision for the current Archetype draft: approve, request changes, or reject.",
  inputSchema: {
    type: "object",
    properties: {
      draftDir: {
        type: "string",
        description: "Draft output directory or draft phase package being reviewed."
      },
      inputPath: {
        type: "string",
        description: "Source intake JSON path that produced the reviewed draft."
      },
      outputDir: {
        type: "string",
        description: "Optional output directory for the approved canonical package or revised draft."
      },
      approvedInputPath: {
        type: "string",
        description: "Optional path for the approved or revised intake JSON."
      },
      decision: {
        type: "string",
        enum: ["approve", "request_changes", "reject"],
        description: "Human decision."
      },
      reviewer: {
        type: "string",
        description: "Human reviewer name."
      },
      feedback: {
        type: "string",
        description: "Required for request_changes; optional for approve/reject."
      },
      approvedAssumptionIds: {
        type: "array",
        items: { type: "string" },
        description: "Assumption ids explicitly approved by the human reviewer."
      },
      selectedDecisionIds: {
        type: "array",
        items: { type: "string" },
        description: "Review checklist ids explicitly selected by the human reviewer."
      },
      overwrite: {
        type: "boolean",
        description: "Allow replacing marked generated output directories."
      }
    },
    required: ["draftDir", "inputPath", "decision", "reviewer"]
  },
  run(args: unknown): JsonRecord {
    const record = asRecord(args);
    return { ...submitReviewDecision({
      draftDir: resolveDeclaredPath(record.draftDir, "", "draftDir"),
      inputPath: resolveDeclaredPath(record.inputPath, "", "inputPath"),
      outputDir: stringValue(record, "outputDir") || undefined,
      approvedInputPath: stringValue(record, "approvedInputPath") || undefined,
      decision: reviewDecision(stringValue(record, "decision")),
      reviewer: stringValue(record, "reviewer"),
      feedback: stringValue(record, "feedback") || undefined,
      approvedAssumptionIds: arrayValue(record, "approvedAssumptionIds"),
      selectedDecisionIds: arrayValue(record, "selectedDecisionIds"),
      force: booleanValue(record, "overwrite", true)
    }) };
  }
};
