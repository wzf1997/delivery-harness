import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const cli = resolve("dist/cli.js");

function run(args, expected) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
  if (result.status !== expected) {
    throw new Error(`deliveryguard ${args.join(" ")} exited ${result.status}, expected ${expected}\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

const self = run(["check"], 0);
if (!self.includes("v0.1.0: specified")) throw new Error("self-check did not report specified");

const example = run(["-C", "examples/synthetic-shop", "check"], 0);
if (!example.includes("v1.2.0: released")) throw new Error("synthetic example did not report released");

const initialized = mkdtempSync(resolve(tmpdir(), "deliveryguard-cli-init-"));
run(["-C", initialized, "init", "--codex"], 0);
run(["-C", initialized, "init", "--codex"], 2);
run(["-C", initialized, "check"], 0);

const invalid = mkdtempSync(resolve(tmpdir(), "deliveryguard-cli-invalid-"));
writeFileSync(resolve(invalid, "deliveryguard.config.json"), "{}\n", "utf8");
run(["-C", invalid, "check"], 1);
run(["not-a-command"], 2);

console.log("CLI smoke check passed (exit codes 0, 1, and 2). ");
