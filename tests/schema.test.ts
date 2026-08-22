import { describe, expect, it } from "vitest";

import { validateSchema } from "../src/schemas.js";
import { config, evidence, version } from "./helpers.js";

describe("public schemas", () => {
  it("accepts valid records", () => {
    expect(validateSchema("config", config)).toEqual([]);
    expect(validateSchema("version", version)).toEqual([]);
    expect(validateSchema("evidence", evidence)).toEqual([]);
  });

  it("rejects absolute repository paths", () => {
    const invalid = structuredClone(config);
    invalid.paths.versions = "/private/versions";
    expect(validateSchema("config", invalid).some((item) => item.code.includes("not"))).toBe(true);
  });

  it("rejects non-semver versions", () => {
    const invalid = structuredClone(version);
    invalid.version = "1.0";
    expect(validateSchema("version", invalid)).not.toEqual([]);
  });
});
