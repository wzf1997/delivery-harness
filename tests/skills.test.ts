import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const skillsRoot = resolve("templates/codex/.agents/skills");
const repositorySkillsRoot = resolve(".agents/skills");

function skillDirectories(root = skillsRoot): string[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function filesBelow(root: string, directory = root): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = resolve(directory, entry.name);
    return entry.isDirectory() ? filesBelow(root, target) : [target.slice(root.length + 1)];
  });
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

  it("keeps repository-discoverable skills identical to packaged templates", () => {
    expect(skillDirectories(repositorySkillsRoot)).toEqual(skillDirectories());
    const packagedFiles = filesBelow(skillsRoot).sort();
    expect(filesBelow(repositorySkillsRoot).sort()).toEqual(packagedFiles);
    for (const file of packagedFiles) {
      expect(readFileSync(resolve(repositorySkillsRoot, file))).toEqual(readFileSync(resolve(skillsRoot, file)));
    }
  });
});
