import { mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prepareJevReview, runJevReview, JEV_ENDPOINT } from "../src/adapters/jev.js";
import { jevOutputDirectory, saveJevReview } from "../src/adapters/jev-files.js";
import { reviewDigest, validateReview } from "../src/review.js";
import type { ReviewPolicy, ReviewRecord } from "../src/review-types.js";
import { write } from "./helpers.js";

let root: string;
let policy: ReviewPolicy;
let record: ReviewRecord;
const validResponse = () => ({ model: "jev-1.13.0", answers: {
  ui_only: { type: "noul", noul: 0.99 }, criteria_clear: { type: "noul", noul: 0.98 }, needs_human: { type: "noul", noul: 0.01 },
}, usage: { input_tokens: 240, output_tokens: 20 } });
const mockFetch = () => vi.fn<typeof fetch>().mockResolvedValue(Response.json(validResponse()));
const options = (transport: typeof fetch) => ({ apiKey: "test", evidencePath: "output/evidence.json", fetch: transport });
function rebind() { record.checks[0]!.candidateDigest = reviewDigest(record.candidate); }

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "deliveryguard-jev-"));
  policy = JSON.parse(readFileSync("examples/synthetic-shop/reviews/policy.json", "utf8"));
  policy.autoReview.enabled = true;
  record = JSON.parse(readFileSync("examples/synthetic-shop/reviews/hotfix.json", "utf8"));
  record.candidate.mode = "delivery";
  rebind();
  write(root, "reviews/evidence.txt", "Synthetic check evidence.\n");
});
afterEach(() => { vi.restoreAllMocks(); rmSync(root, { recursive: true, force: true }); });

describe("Jev request and provider mapping", () => {
  it("previews exactly the minimal payload without calling fetch", () => {
    const transport = vi.spyOn(globalThis, "fetch");
    const preview = prepareJevReview(root, policy, record);
    expect(preview.ok).toBe(true);
    expect(transport).not.toHaveBeenCalled();
    const payload = JSON.stringify(preview.request);
    for (const absent of [record.candidate.author, record.candidate.commit, record.candidate.branch, record.candidate.files[0]!.path, "reviews/evidence.txt"]) {
      expect(payload).not.toContain(absent);
    }
    expect(Object.keys(preview.request!.questions)).toEqual(["ui_only", "criteria_clear", "needs_human"]);
  });
  it("calls the official endpoint once and binds normalized probabilities to both digests", async () => {
    const transport = mockFetch();
    const result = await runJevReview(root, policy, record, options(transport));
    expect(result.status).toBe("approved");
    expect(result.decision).toMatchObject({ model: "jev-1.13.0", suitability: 0.98, risk: 0.01,
      candidateDigest: reviewDigest(record.candidate), policyDigest: reviewDigest(policy) });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0]![0]).toBe(JEV_ENDPOINT);
    expect(transport.mock.calls[0]![1]).toMatchObject({ method: "POST", redirect: "error", headers: { Authorization: "Bearer test" } });
    const path = saveJevReview(root, "output", policy, record, result);
    const saved = JSON.parse(readFileSync(join(root, path), "utf8")) as ReviewRecord;
    expect(validateReview(root, policy, saved).route).toBe("automatic");
    expect(result.evidence.requestDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(result.evidence.usage).toEqual({ inputTokens: 240, outputTokens: 20 });
    expect(JSON.stringify(result.evidence)).not.toContain("Bearer");
    expect(record.decisions).toEqual([]);
  });
  it("persists low scores without manufacturing an approval or retaining an old automatic approval", async () => {
    record.decisions.push({ kind: "automatic", outcome: "approved", reviewer: "old-model", candidateDigest: reviewDigest(record.candidate), policyDigest: reviewDigest(policy),
      recordedAt: "2020-01-01T00:00:00Z", expiresAt: "2020-01-02T00:00:00Z", evidence: "reviews/evidence.txt", model: "old", suitability: 1, risk: 0 });
    const body = validResponse(); body.answers.needs_human.noul = 0.6;
    const transport = vi.fn<typeof fetch>().mockResolvedValue(Response.json(body));
    const result = await runJevReview(root, policy, record, options(transport));
    expect(result.status).toBe("human-required"); expect(result.decision).toBeUndefined();
    expect(result.evidence.scores?.needsHuman).toBe(0.6);
    const saved = JSON.parse(readFileSync(join(root, saveJevReview(root, "output", policy, record, result)), "utf8"));
    expect(saved.decisions).toEqual([]); expect(record.decisions).toHaveLength(1);
    expect(validateReview(root, policy, saved).ok).toBe(false);
  });
  it("checks each suitability probability rather than averaging away uncertainty", async () => {
    const body = validResponse(); body.answers.criteria_clear.noul = 0.5;
    const result = await runJevReview(root, policy, record, options(vi.fn<typeof fetch>().mockResolvedValue(Response.json(body))));
    expect(result.status).toBe("human-required");
  });
});

describe("preflight and network boundaries", () => {
  it.each(["disabled", "production", "hotfix", "sensitive", "scope", "failed-check", "rejected", "rules"])("never sends ineligible %s candidates", async (kind) => {
    if (kind === "disabled") policy.autoReview.enabled = false;
    if (kind === "production") record.candidate.environmentId = "production";
    if (kind === "hotfix") record.candidate.mode = "hotfix";
    if (kind === "sensitive") record.candidate.sensitiveFindings.push("auth");
    if (kind === "scope") record.candidate.files[0]!.path = "src/server/handler.ts";
    if (kind === "failed-check") record.checks[0]!.status = "fail";
    if (kind === "rules") record.candidate.task.changesRules = true;
    rebind();
    if (kind === "rejected") record.decisions.push({ kind: "human", outcome: "rejected", reviewer: "maintainer", candidateDigest: reviewDigest(record.candidate), policyDigest: reviewDigest(policy), recordedAt: "2020-01-01T00:00:00Z", expiresAt: "2020-01-02T00:00:00Z", evidence: "reviews/evidence.txt" });
    const transport = mockFetch(); const result = await runJevReview(root, policy, record, options(transport));
    expect(result.status).toBe("human-required"); expect(transport).not.toHaveBeenCalled();
  });
  it("does not call the provider without an API key", async () => {
    const transport = mockFetch(); const result = await runJevReview(root, policy, record, { evidencePath: "output/evidence.json", fetch: transport });
    expect(result.diagnostics[0]!.code).toBe("jev.credentials"); expect(transport).not.toHaveBeenCalled();
  });
  it("bounds payload size before transmission", async () => {
    record.candidate.task.summary = "x".repeat(20_000); rebind();
    const transport = mockFetch(); const result = await runJevReview(root, policy, record, options(transport));
    expect(result.diagnostics[0]!.code).toBe("jev.payload-size"); expect(transport).not.toHaveBeenCalled();
  });
  it("rejects invalid model IDs, evidence paths and timeout settings before networking", async () => {
    const transport = mockFetch();
    for (const override of [{ model: "other" }, { evidencePath: "../escape.json" }, { timeoutMs: 0 }, { timeoutMs: 30001 }]) {
      expect((await runJevReview(root, policy, record, { ...options(transport), ...override })).status).toBe("human-required");
    }
    expect(transport).not.toHaveBeenCalled();
  });
  it("discards results if inputs change during evaluation", async () => {
    const transport = vi.fn<typeof fetch>().mockImplementation(async () => { record.candidate.tree = "c".repeat(40); return Response.json(validResponse()); });
    const result = await runJevReview(root, policy, record, options(transport));
    expect(result.diagnostics[0]!.code).toBe("jev.changed"); expect(result.decision).toBeUndefined();
  });
  it("does not swallow a human rejection arriving during evaluation", async () => {
    const transport = vi.fn<typeof fetch>().mockImplementation(async () => {
      record.decisions.push({ kind: "human", outcome: "rejected", reviewer: "maintainer", candidateDigest: reviewDigest(record.candidate), policyDigest: reviewDigest(policy), recordedAt: new Date().toISOString(), expiresAt: new Date().toISOString(), evidence: "reviews/evidence.txt" });
      return Response.json(validResponse());
    });
    expect((await runJevReview(root, policy, record, options(transport))).status).toBe("human-required");
  });
});

describe("fail-closed provider errors", () => {
  it.each([401, 422, 429, 529, 500, 302])("HTTP %s returns human-required without exposing response bodies or retrying", async (status) => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response("private-response-body", { status }));
    const result = await runJevReview(root, policy, record, options(transport));
    expect(result.status).toBe("human-required"); expect(transport).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(result)).not.toContain("private-response-body"); expect(result.decision).toBeUndefined();
  });
  it("never echoes raw transport errors", async () => {
    const transport = vi.fn<typeof fetch>().mockRejectedValue(new Error("Bearer private-response-body"));
    const result = await runJevReview(root, policy, record, options(transport));
    expect(JSON.stringify(result)).not.toContain("private-response-body");
  });
  it("aborts the provider call on timeout", async () => {
    const transport = vi.fn<typeof fetch>().mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init!.signal!.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    }));
    const result = await runJevReview(root, policy, record, { ...options(transport), timeoutMs: 10 });
    expect(result.diagnostics[0]!.code).toBe("jev.timeout");
  });
  it.each(["missing-answer", "wrong-type", "string-number", "out-of-range", "missing-model", "wrong-model", "missing-usage", "extra-answer", "null"])("rejects malformed %s responses", async (kind) => {
    const body: any = validResponse();
    if (kind === "missing-answer") delete body.answers.ui_only;
    if (kind === "wrong-type") body.answers.ui_only.type = "score";
    if (kind === "string-number") body.answers.ui_only.noul = "1";
    if (kind === "out-of-range") body.answers.ui_only.noul = 2;
    if (kind === "missing-model") delete body.model;
    if (kind === "wrong-model") body.model = "other-model";
    if (kind === "missing-usage") delete body.usage;
    if (kind === "extra-answer") body.answers.extra = { type: "noul", noul: 1 };
    const transport = vi.fn<typeof fetch>().mockResolvedValue(Response.json(kind === "null" ? null : body));
    const result = await runJevReview(root, policy, record, options(transport));
    expect(result.diagnostics[0]!.code).toBe("jev.response"); expect(result.decision).toBeUndefined();
  });
  it("rejects a response from a different pinned version", async () => {
    const result = await runJevReview(root, policy, record, { ...options(mockFetch()), model: "jev-1.12.0" });
    expect(result.status).toBe("human-required");
  });
  it.each(["not JSON", "x".repeat(70_000)])("bounds response parsing without preserving raw content", async (body) => {
    const result = await runJevReview(root, policy, record, options(vi.fn<typeof fetch>().mockResolvedValue(new Response(body))));
    expect(result.status).toBe("human-required"); expect(result.decision).toBeUndefined();
  });
});

describe("output safety", () => {
  it("never overwrites existing output or escapes through a symlink", () => {
    write(root, "existing/file.txt", "keep");
    expect(() => jevOutputDirectory(root, "existing")).toThrow();
    expect(() => jevOutputDirectory(root, "../escape")).toThrow();
    symlinkSync(tmpdir(), join(root, "outside"));
    expect(() => jevOutputDirectory(root, "outside/new-output")).toThrow();
    expect(readFileSync(join(root, "existing/file.txt"), "utf8")).toBe("keep");
  });
});
