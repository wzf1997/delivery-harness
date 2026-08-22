import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryInstructions = readFileSync(resolve("AGENTS.md"), "utf8");
const starterInstructions = readFileSync(resolve("templates/default/AGENTS.md"), "utf8");

describe("agent instructions", () => {
  it("installs the DeliveryGuard harness contract", () => {
    for (const section of [
      "Scope and precedence",
      "Authority by request type",
      "DeliveryGuard facts",
      "Acceptance and release",
      "Repair Cases",
      "Git and user-work protection",
      "Verification and handoff",
    ]) {
      expect(starterInstructions).toContain(section);
    }
    expect(starterInstructions).toContain("planned -> specified -> implemented -> verified -> released");
  });

  it("keeps repository-specific and public-safety rules", () => {
    expect(repositoryInstructions).toContain("Repository map and facts");
    expect(repositoryInstructions).toContain("clean-room");
    expect(repositoryInstructions).toContain("pnpm check");
    expect(repositoryInstructions).toContain(".agents/skills");
  });

  it("contains no private coordinates", () => {
    for (const contents of [repositoryInstructions, starterInstructions]) {
      expect(contents).not.toMatch(/https?:\/\//i);
      expect(contents).not.toMatch(/\/Users\/|[A-Za-z]:\\Users\\/);
      expect(contents).not.toMatch(/(?:token|secret|password)\s*[:=]\s*\S+/i);
    }
  });
});
