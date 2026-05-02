import type { LLMProvider, LLMRequest, LLMResponse } from "./types";
import { assertRequiredFields, parseStructuredJson } from "./structuredOutput";

export class DeterministicLLMProvider implements LLMProvider {
  name = "deterministic-local";

  async generateStructured<T>(request: LLMRequest): Promise<LLMResponse<T>> {
    const fallback = {
      module: request.module,
      task: request.task,
      status: "not_llm_generated",
      rationale: "Deterministic local provider returns a schema-aware placeholder for offline compiler runs."
    };
    const raw = JSON.stringify(fallback);
    const parsed = parseStructuredJson(raw);
    const missing = assertRequiredFields(parsed.value, request.outputSchema);
    return {
      value: parsed.value as T,
      raw,
      provider: this.name,
      repaired: parsed.repaired,
      warnings: [...parsed.warnings, ...missing]
    };
  }
}
