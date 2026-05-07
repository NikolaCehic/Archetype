import { applyClarificationAnswer } from "../../modules/clarificationUx";
import type { ArchetypeInput } from "../../core/types";
import {
  asRecord,
  readJsonFile,
  resolveDeclaredPath,
  stringValue,
  writeJsonFile,
  type JsonRecord,
  type McpToolDefinition
} from "./shared";

export const answerClarificationTool: McpToolDefinition = {
  name: "archetype_answer_clarification",
  description: "Apply one user clarification answer to an intake file, rebuild the context matrix, and return the next single question or readiness to proceed.",
  inputSchema: {
    type: "object",
    properties: {
      inputPath: {
        type: "string",
        description: "Path to the current Archetype intake JSON file."
      },
      outputPath: {
        type: "string",
        description: "Where to write the updated intake JSON file. Defaults to inputPath."
      },
      questionId: {
        type: "string",
        description: "The current clarification question id from lifecycle/clarification-questions.json."
      },
      answer: {
        type: "string",
        description: "The user's answer to exactly one current clarification question."
      },
      answeredBy: {
        type: "string",
        description: "Optional human or agent label for provenance."
      }
    },
    required: ["inputPath", "questionId", "answer"]
  },
  run(args: unknown): JsonRecord {
    const record = asRecord(args);
    const inputPath = resolveDeclaredPath(record.inputPath, "", "inputPath");
    const outputPath = resolveDeclaredPath(record.outputPath, inputPath, "outputPath");
    const questionId = stringValue(record, "questionId");
    const answer = stringValue(record, "answer");
    const answeredBy = stringValue(record, "answeredBy") || "user";
    if (!questionId) throw new Error("questionId is required.");
    if (!answer) throw new Error("answer is required.");

    const intake = readJsonFile<ArchetypeInput>(inputPath);
    const applied = applyClarificationAnswer({
      intake,
      questionId,
      answer,
      answeredBy
    });
    writeJsonFile(outputPath, applied.updatedInput);
    return {
      status: applied.status,
      inputPath,
      outputPath,
      answeredQuestion: applied.answeredQuestion?.question ?? null,
      answeredQuestionId: applied.answeredQuestion?.id ?? questionId,
      contextStatus: applied.contextStatus,
      readinessTier: applied.readinessTier,
      nextQuestion: applied.nextQuestion?.question ?? null,
      nextQuestionId: applied.nextQuestion?.id ?? null,
      clarificationTurn: applied.clarificationTurn
    };
  }
};
