export type DataPlaneErrorCode =
  | "DATA_PLANE_NOT_FOUND"
  | "RUN_NOT_FOUND"
  | "RUN_ALREADY_EXISTS"
  | "ARTIFACT_NOT_FOUND"
  | "PROJECTION_NOT_FOUND"
  | "INVALID_DATA_PLANE_RECORD"
  | "INVALID_DATA_PLANE_ARGUMENT";

export class DataPlaneError extends Error {
  readonly code: DataPlaneErrorCode;
  readonly details: Record<string, string | number | boolean | null>;

  constructor(code: DataPlaneErrorCode, message: string, details: Record<string, string | number | boolean | null> = {}) {
    super(message);
    this.name = "DataPlaneError";
    this.code = code;
    this.details = details;
  }
}

export function isDataPlaneError(error: unknown): error is DataPlaneError {
  return error instanceof DataPlaneError;
}
