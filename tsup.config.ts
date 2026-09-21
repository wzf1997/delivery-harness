import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts", jev: "src/adapters/jev.ts" },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "node22",
  },
  {
    entry: ["src/cli.ts"],
    format: ["esm"],
    dts: false,
    sourcemap: true,
    banner: { js: "#!/usr/bin/env node" },
    target: "node22",
  },
]);
