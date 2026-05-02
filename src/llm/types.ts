export interface LLMRequest {
  module: string;
  task: string;
  system: string;
  developer: string;
  input: unknown;
  outputSchema: Record<string, unknown>;
}

export interface LLMResponse<T = unknown> {
  value: T;
  raw: string;
  provider: string;
  repaired: boolean;
  warnings: string[];
}

export interface LLMProvider {
  name: string;
  generateStructured<T>(request: LLMRequest): Promise<LLMResponse<T>>;
}
