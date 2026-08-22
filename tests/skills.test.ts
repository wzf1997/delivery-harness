import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const skillsRoot = resolve("templates/codex/.agents/skills");

function skillDirectories(): string[] {
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

describe("bundled Codex skills", () => {
  it("ships the complete provider-neutral workflow suite", () => {
    const names = skillDirectories();
    expect(names).toHaveLength(17);
    expect(names).toContain("deliveryguard-openspec-explore");
    expect(names).toContain("deliveryguard-fixture-plan");
    expect(names).toContain("deliveryguard-acceptance-handoff");
    expect(names).toContain("deliveryguard-knowledge-capture");
  });

  it("uses valid names and excludes private coordinates", () => {
    for (const directory of skillDirectories()) {
      const contents = readFileSync(resolve(skillsRoot, directory, "SKILL.md"), "utf8");
      expect(contents).toMatch(/^---\nname: deliveryguard-[a-z0-9-]+\ndescription: .+\n---/);
      expect(contents).not.toMatch(/https?:\/\//i);
      expect(contents).not.toMatch(/\/Users\/|[A-Za-z]:\\Users\\/);
      expect(contents).not.toMatch(/(?:token|secret|password)\s*[:=]\s*\S+/i);
    }
  });
});
