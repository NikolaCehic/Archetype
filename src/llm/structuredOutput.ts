export function parseStructuredJson(raw: string): { value: unknown; repaired: boolean; warnings: string[] } {
  const warnings: string[] = [];
  try {
    return { value: JSON.parse(raw), repaired: false, warnings };
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try {
        warnings.push("Parsed JSON from fenced block after initial parse failed.");
        return { value: JSON.parse(fenced[1] ?? ""), repaired: true, warnings };
      } catch {
        warnings.push("Fenced JSON repair failed.");
      }
    }
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        warnings.push("Parsed JSON object substring after initial parse failed.");
        return { value: JSON.parse(raw.slice(firstBrace, lastBrace + 1)), repaired: true, warnings };
      } catch {
        warnings.push("JSON substring repair failed.");
      }
    }
  }
  throw new Error("LLM output could not be parsed as structured JSON.");
}

export function assertRequiredFields(value: unknown, schema: Record<string, unknown>): string[] {
  if (typeof value !== "object" || value === null) return ["Output is not an object."];
  const record = value as Record<string, unknown>;
  const required = Array.isArray(schema.required) ? schema.required.filter((item): item is string => typeof item === "string") : [];
  return required.filter((field) => !Object.prototype.hasOwnProperty.call(record, field)).map((field) => `Missing required field: ${field}`);
}
