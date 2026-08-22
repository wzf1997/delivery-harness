export * from "./types.js";
export { validateSchema } from "./schemas.js";
export { deriveVersionStatus } from "./status.js";
export { validateEvidence, validateProject, validateVersion } from "./validate.js";
export { runRepairPhase, validateRepairCase } from "./repair.js";

export function defineConfig<T>(config: T): T {
  return config;
}
