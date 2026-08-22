import { execFileSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

import { error, hasErrors } from "./diagnostics.js";
import { resolveInside } from "./io.js";
import { validateSchema } from "./schemas.js";
import type { Diagnostic, RepairCase, RepairRunResult } from "./types.js";

const stageIndex = new Map(["reported", "reproduced", "diagnosed", "resolved", "verified", "closed"].map((item, index) => [item, index]));

export function validateRepairCase(root: string, repair: RepairCase): Diagnostic[] {
  const diagnostics = validateSchema("repair-case", repair);
  if (hasErrors(diagnostics)) return diagnostics;
  const stage = stageIndex.get(repair.stage) ?? 0;
  if (stage >= 1 && !repair.baseline) diagnostics.push(error("repair.baseline-required", `${repair.stage} requires baseline`));
  if (stage >= 3 && !repair.candidate) diagnostics.push(error("repair.candidate-required", `${repair.stage} requires candidate`));
  if (stage >= 4) {
    if (!repair.baseline || !repair.candidate || repair.baseline.commit === repair.candidate.commit) {
      diagnostics.push(error("repair.red-green-commits", `verified repair requires different baseline and candidate commits`));
    }
    for (const phase of ["reproduction", "targeted", "regression"] as const) {
      if (repair.phases[phase].length === 0) diagnostics.push(error("repair.phase-required", `verified repair requires ${phase} checks`));
    }
  }
  for (const gitRef of [repair.baseline, repair.candidate]) {
    if (!gitRef) continue;
    try {
      if (!existsSync(resolveInside(root, gitRef.repository))) {
        diagnostics.push(error("repair.repository-missing", `repair repository does not exist`, gitRef.repository));
      }
    } catch (cause) {
      diagnostics.push(error("repair.repository-path", String(cause), gitRef.repository));
    }
  }
  for (const phase of Object.values(repair.phases)) {
    for (const check of phase) {
      if (check.outputPattern) {
        try {
          new RegExp(check.outputPattern, "m");
        } catch (cause) {
          diagnostics.push(error("repair.output-pattern", `invalid outputPattern: ${String(cause)}`, check.id));
        }
      }
    }
  }
  if (repair.stage === "closed" && repair.status === "active") {
    diagnostics.push(error("repair.closed-status", `closed repair cannot remain active`));
  }
  return diagnostics;
}

function gitHead(path: string): string {
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: path, encoding: "utf8" }).trim();
}

async function runCheck(root: string, repository: string, check: RepairCase["phases"]["targeted"][number]): Promise<RepairRunResult> {
  const repositoryRoot = resolveInside(root, repository);
  const cwd = check.cwd ? resolveInside(repositoryRoot, check.cwd) : repositoryRoot;
  const [command, ...args] = check.command;
  if (!command) throw new Error(`repair check ${check.id} has no command`);
  const started = performance.now();
  return await new Promise((resolveResult) => {
    const child = spawn(command, args, { cwd, shell: false, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => (stdout += chunk));
    child.stderr.on("data", (chunk: string) => (stderr += chunk));
    const timer = setTimeout(() => child.kill("SIGTERM"), check.timeoutMs ?? 120_000);
    child.on("error", (cause) => {
      clearTimeout(timer);
      stderr += cause.message;
    });
    child.on("close", (exitCode) => {
      clearTimeout(timer);
      const outputMatches = check.outputPattern ? new RegExp(check.outputPattern, "m").test(`${stdout}\n${stderr}`) : true;
      resolveResult({
        checkId: check.id,
        passed: exitCode === check.expectedExitCode && outputMatches,
        exitCode,
        stdout,
        stderr,
        durationMs: Math.round(performance.now() - started),
      });
    });
  });
}

export async function runRepairPhase(
  root: string,
  repair: RepairCase,
  phase: "reproduction" | "targeted" | "regression",
): Promise<RepairRunResult[]> {
  const diagnostics = validateRepairCase(root, repair);
  if (hasErrors(diagnostics)) throw new Error(diagnostics.map((item) => item.message).join("; "));
  const expected = phase === "reproduction" ? repair.baseline : repair.candidate;
  if (!expected) throw new Error(`${phase} requires ${phase === "reproduction" ? "baseline" : "candidate"}`);
  const repository = resolveInside(root, expected.repository);
  const actualHead = gitHead(repository);
  if (actualHead !== expected.commit) {
    throw new Error(`${phase} requires ${expected.commit}, current HEAD is ${actualHead}`);
  }
  const results: RepairRunResult[] = [];
  for (const check of repair.phases[phase]) results.push(await runCheck(root, expected.repository, check));
  return results;
}
