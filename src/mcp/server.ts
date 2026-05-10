#!/usr/bin/env node

import { createInterface } from "node:readline";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isDataPlaneError } from "../data-plane";
import { getMcpPrompt, listMcpPrompts } from "./prompts";
import { listMcpResourceTemplates, listMcpResources, readMcpResource } from "./resources";
import { archetypeMcpTools } from "./tools";
import { asRecord, type JsonRecord } from "./tools/shared";

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: unknown;
}

const SUPPORTED_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05", "2024-10-07"];

function packageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "..", "..", "package.json"), "utf8")) as { version?: string };
    return pkg.version ?? "0.1.0";
  } catch {
    return "0.1.0";
  }
}

function send(message: JsonRecord): void {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function sendResult(id: JsonRpcId, result: unknown): void {
  send({ jsonrpc: "2.0", id, result });
}

function sendError(id: JsonRpcId, code: number, message: string, data?: unknown): void {
  send({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data })
    }
  });
}

function negotiateProtocolVersion(params: unknown): string {
  const requested = asRecord(params).protocolVersion;
  if (typeof requested === "string" && SUPPORTED_PROTOCOL_VERSIONS.includes(requested)) return requested;
  return SUPPORTED_PROTOCOL_VERSIONS[0];
}

function toolResult(payload: unknown): JsonRecord {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2)
      }
    ],
    structuredContent: payload
  };
}

function toolError(error: unknown): JsonRecord {
  const payload = isDataPlaneError(error)
    ? {
      status: "error",
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    }
    : {
      status: "error",
      message: error instanceof Error ? error.message : String(error)
    };
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2)
      }
    ],
    structuredContent: payload
  };
}

async function handleToolCall(params: unknown): Promise<JsonRecord> {
  const record = asRecord(params);
  const name = typeof record.name === "string" ? record.name : "";
  const tool = archetypeMcpTools.find((candidate) => candidate.name === name);
  if (!tool) {
    return toolError(`Unknown tool "${name}". Known tools: ${archetypeMcpTools.map((candidate) => candidate.name).join(", ")}`);
  }

  try {
    return toolResult(await tool.run(record.arguments ?? {}));
  } catch (error) {
    return toolError(error);
  }
}

async function handleRequest(request: JsonRpcRequest): Promise<void> {
  const id = request.id ?? null;
  const method = request.method;
  if (!method) {
    if ("id" in request) sendError(id, -32600, "Invalid request: method is required.");
    return;
  }

  if (method === "notifications/initialized") return;
  if (method === "initialize") {
    sendResult(id, {
      protocolVersion: negotiateProtocolVersion(request.params),
      capabilities: {
        tools: {
          listChanged: false
        },
        resources: {
          subscribe: false,
          listChanged: false
        },
        prompts: {
          listChanged: false
        }
      },
      serverInfo: {
        name: "archetype-mcp",
        version: packageVersion()
      },
      instructions: "Archetype exposes deterministic tools, resources, and prompts for the natural-language lifecycle, consumer-plane next actions, review console decisions, progressive/lazy artifact reads, Agent Data Plane queries, validation, verification, and repair."
    });
    return;
  }

  if (method === "ping") {
    sendResult(id, {});
    return;
  }

  if (method === "tools/list") {
    sendResult(id, {
      tools: archetypeMcpTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    });
    return;
  }

  if (method === "tools/call") {
    sendResult(id, await handleToolCall(request.params));
    return;
  }

  if (method === "resources/list") {
    sendResult(id, listMcpResources());
    return;
  }

  if (method === "resources/templates/list") {
    sendResult(id, listMcpResourceTemplates());
    return;
  }

  if (method === "resources/read") {
    const uri = asRecord(request.params).uri;
    if (typeof uri !== "string") {
      sendError(id, -32602, "resources/read requires a string uri.");
      return;
    }
    try {
      sendResult(id, readMcpResource(uri));
    } catch (error) {
      sendError(id, -32603, error instanceof Error ? error.message : String(error));
    }
    return;
  }

  if (method === "prompts/list") {
    sendResult(id, listMcpPrompts());
    return;
  }

  if (method === "prompts/get") {
    try {
      sendResult(id, getMcpPrompt(request.params));
    } catch (error) {
      sendError(id, -32603, error instanceof Error ? error.message : String(error));
    }
    return;
  }

  if ("id" in request) sendError(id, -32601, `Method not found: ${method}`);
}

const rl = createInterface({
  input: process.stdin,
  crlfDelay: Infinity
});

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let message: JsonRpcRequest;
  try {
    message = JSON.parse(trimmed) as JsonRpcRequest;
  } catch (error) {
    sendError(null, -32700, "Parse error", error instanceof Error ? error.message : String(error));
    return;
  }

  handleRequest(message).catch((error) => {
    const id = message.id ?? null;
    sendError(id, -32603, error instanceof Error ? error.message : String(error));
  });
});
