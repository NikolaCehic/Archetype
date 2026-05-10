import { readFileSync } from "node:fs";
import path from "node:path";
import { resolveInside, type JsonRecord } from "./tools/shared";

interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

interface McpResourceTemplate {
  uriTemplate: string;
  name: string;
  description: string;
  mimeType: string;
}

const DOC_RESOURCES: McpResource[] = [
  {
    uri: "archetype://docs/consumer-plane",
    name: "Archetype Consumer Plane",
    description: "Natural-language front door, next-action contract, and bounded read policy.",
    mimeType: "text/markdown"
  },
  {
    uri: "archetype://docs/agent-lifecycle",
    name: "Archetype Agent Lifecycle",
    description: "Clarification, draft review, approval, tests-first implementation, verification, and repair.",
    mimeType: "text/markdown"
  },
  {
    uri: "archetype://docs/agent-control-plane",
    name: "Archetype Agent Control Plane",
    description: "Phase permission gates and host-agent enforcement policy.",
    mimeType: "text/markdown"
  },
  {
    uri: "archetype://docs/agent-data-plane",
    name: "Archetype Agent Data Plane",
    description: "Replayable run state, events, artifact lineage, projections, and repair provenance.",
    mimeType: "text/markdown"
  }
];

const DOC_PATHS: Record<string, string> = {
  "archetype://docs/consumer-plane": "docs/consumer-plane.md",
  "archetype://docs/agent-lifecycle": "docs/agent-lifecycle.md",
  "archetype://docs/agent-control-plane": "docs/agent-control-plane.md",
  "archetype://docs/agent-data-plane": "docs/agent-data-plane.md"
};

const RESOURCE_TEMPLATES: McpResourceTemplate[] = [
  {
    uriTemplate: "archetype://package/{encodedOutputDir}/agent-context/consumer-plane.json",
    name: "Current package consumer plane",
    description: "Read the compact next-action contract for a generated package.",
    mimeType: "application/json"
  },
  {
    uriTemplate: "archetype://package/{encodedOutputDir}/review-console/session.json",
    name: "Current package review session",
    description: "Read the review cockpit state for a generated package.",
    mimeType: "application/json"
  },
  {
    uriTemplate: "archetype://package/{encodedOutputDir}/progressive/lazy-contract-index.json",
    name: "Current package lazy contract index",
    description: "Read phase-scoped lazy expansion rules and required artifacts.",
    mimeType: "application/json"
  },
  {
    uriTemplate: "archetype://package/{encodedOutputDir}/mcp/current-phase-resources.json",
    name: "Current phase resource index",
    description: "Read resource descriptors for the active phase.",
    mimeType: "application/json"
  }
];

function mimeTypeForPath(filePath: string): string {
  if (filePath.endsWith(".json")) return "application/json";
  if (filePath.endsWith(".html")) return "text/html";
  if (filePath.endsWith(".md")) return "text/markdown";
  return "text/plain";
}

function parsePackageUri(uri: string): { outputDir: string; relativePath: string } | null {
  const prefix = "archetype://package/";
  if (!uri.startsWith(prefix)) return null;
  const remainder = uri.slice(prefix.length);
  const slash = remainder.indexOf("/");
  if (slash === -1) return null;
  const encodedOutputDir = remainder.slice(0, slash);
  const relativePath = remainder.slice(slash + 1);
  return {
    outputDir: decodeURIComponent(encodedOutputDir),
    relativePath: decodeURIComponent(relativePath)
  };
}

export function listMcpResources(): JsonRecord {
  return { resources: DOC_RESOURCES };
}

export function listMcpResourceTemplates(): JsonRecord {
  return { resourceTemplates: RESOURCE_TEMPLATES };
}

export function readMcpResource(uri: string): JsonRecord {
  const docPath = DOC_PATHS[uri];
  if (docPath) {
    const absolutePath = path.resolve(docPath);
    return {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text: readFileSync(absolutePath, "utf8")
        }
      ]
    };
  }
  const parsed = parsePackageUri(uri);
  if (!parsed) throw new Error(`Unknown Archetype resource URI: ${uri}`);
  const artifactPath = resolveInside(parsed.outputDir, parsed.relativePath, "resource path");
  return {
    contents: [
      {
        uri,
        mimeType: mimeTypeForPath(parsed.relativePath),
        text: readFileSync(artifactPath, "utf8")
      }
    ]
  };
}

export function packageResourceUri(outputDir: string, relativePath: string): string {
  return `archetype://package/${encodeURIComponent(path.resolve(outputDir))}/${encodeURIComponent(relativePath)}`;
}

