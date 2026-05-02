import { createHash } from "node:crypto";

export function hashContent(content: unknown): string {
  const normalized = typeof content === "string" ? content : stableStringify(content);
  return createHash("sha256").update(normalized).digest("hex");
}

export function shortHash(content: unknown, length = 10): string {
  return hashContent(content).slice(0, length);
}

export function slugify(value: string | undefined, fallback = "archetype-project"): string {
  const source = value && value.trim().length > 0 ? value : fallback;
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

export function stableId(prefix: string, ...parts: unknown[]): string {
  const readable = parts
    .map((part) => slugify(String(part), "item"))
    .join("-")
    .slice(0, 48);
  return `${prefix}_${readable}_${shortHash(parts, 6)}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}
