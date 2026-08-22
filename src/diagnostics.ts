import type { Diagnostic } from "./types.js";

export function error(code: string, message: string, path?: string): Diagnostic {
  return path === undefined
    ? { code, message, severity: "error" }
    : { code, message, path, severity: "error" };
}

export function warning(code: string, message: string, path?: string): Diagnostic {
  return path === undefined
    ? { code, message, severity: "warning" }
    : { code, message, path, severity: "warning" };
}

export function hasErrors(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some((item) => item.severity === "error");
}
