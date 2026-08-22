import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function filesBelow(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = resolve(directory, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  });
}

function templateDirectory(name: "default" | "codex"): string {
  return fileURLToPath(new URL(`../templates/${name}`, import.meta.url));
}

export function initializeProject(root: string, codex = false): string[] {
  const templateRoots = [templateDirectory("default"), ...(codex ? [templateDirectory("codex")] : [])];
  const sources = templateRoots.flatMap((directory) =>
    filesBelow(directory).map((source) => ({ source, relativePath: relative(directory, source) })),
  );
  for (const item of sources) {
    if (existsSync(resolve(root, item.relativePath))) throw new Error(`refusing to overwrite ${item.relativePath}`);
  }
  const created: string[] = [];
  for (const item of sources) {
    const target = resolve(root, item.relativePath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, readFileSync(item.source));
    created.push(item.relativePath);
  }
  for (const directory of [".deliveryguard/versions", ".deliveryguard/acceptance", ".deliveryguard/repairs", "openspec/changes"]) {
    mkdirSync(resolve(root, directory), { recursive: true });
  }
  return created;
}
