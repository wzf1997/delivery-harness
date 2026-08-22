import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function resolveInside(root: string, path: string): string {
  if (isAbsolute(path)) throw new Error(`path must be repository-relative: ${path}`);
  const target = resolve(root, path);
  const fromRoot = relative(resolve(root), target);
  if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
    throw new Error(`path escapes repository root: ${path}`);
  }
  return target;
}

export function existingInside(root: string, path: string): string | undefined {
  const target = resolveInside(root, path);
  return existsSync(target) ? target : undefined;
}
