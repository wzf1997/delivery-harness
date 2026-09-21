# Optional Jev adapter

[中文](jev.zh-CN.md)

The optional `deliveryguard/jev` entry point and `review jev` CLI connect to TypeSafe's public Jev API. `check`, `review validate` and the main `deliveryguard` API remain offline. This adapter is a summary-based review signal, **not a source-code reviewer**: it does not send a diff or verify the actual code, identity, tests or remote Git state.

## CLI

Prepare an ordinary `delivery` candidate and a trusted policy with `autoReview.enabled: true`. Mandatory checks must already pass for the exact candidate digest. Hotfix, integration, production, sensitive findings, human rejection and out-of-scope candidates are ineligible; no network request is made for them. The synthetic Hotfix fixture is intentionally ineligible without adapting its mode and rebinding its checks.

First inspect the exact provider payload locally:

```sh
deliveryguard review jev .deliveryguard/reviews/current.json \
  --policy .deliveryguard/review-policy.json --json
```

Provide `TYPESAFE_API_KEY` through your execution environment or secret manager. Do not put it in candidate files, policy files, command arguments or shell history. The adapter does not search for credentials or load `.env` files. After reviewing the preview, explicitly send:

```sh
mkdir -p .deliveryguard/reviews
deliveryguard review jev .deliveryguard/reviews/current.json \
  --policy .deliveryguard/review-policy.json \
  --model jev-latest --send --output .deliveryguard/reviews/jev-run-001 --json
```

The output directory must be new and its parent must already exist inside the project. Existing records are never overwritten. `evidence.json` is written before `review.json`. On success, validate and register the new review record as the active record in project configuration:

```sh
deliveryguard review validate .deliveryguard/reviews/jev-run-001/review.json \
  --policy .deliveryguard/review-policy.json --json
deliveryguard check
```

Registration is an explicit project change: the command does not silently replace the active list. The original input is unchanged. A failed attempt removes prior automatic approvals for the current candidate from the output copy, retains human decisions, saves sanitized failure evidence and exits 1. Preflight failure does not send or write anything. Invalid CLI/output paths exit 2. A preview's exit 0 means eligible to request evaluation, not approved. Successful sends exit 0 only after an approval record has been saved and validated.

## Data sent and decision mapping

The complete request consists of the selected model, three fixed questions, task summary, acceptance criteria, task kind, file/changed-line counts, rule-change flag and sensitive-finding count. It omits author, task ID, branch, hashes, filenames, source, diff, evidence contents and credentials from the JSON payload. The API key appears only in the HTTPS authorization header. **Free text is not automatically anonymized**: remove confidential text and personal data from the summary and criteria before `--send`. Never send material you are not authorized to disclose.

The adapter asks separate Noul questions about UI-only scope, clear acceptance criteria and need for human review. `suitability` is the minimum of the first two probabilities; `risk` is the third. Both suitability values must meet the existing policy minimum, and risk must not exceed its maximum. Noul is a probability of yes, not a Choice/Score confidence or a guarantee that code is correct. The minimum is a conservative conjunction gate, not a calibrated joint probability.

The response's concrete model ID, all three probabilities, token counts, prompt version, request digest, candidate/policy digests, thresholds and timestamp are retained. Approval expires according to policy. Human rejection and all local gates remain authoritative. Model aliases can change; use `--model jev-1.13.0` or another supported version when calibrating a policy, and re-evaluate thresholds when upgrading.

## Failure and security behavior

- Official HTTPS endpoint only; no alternate host or redirect following.
- One request, no automatic retry or fallback approval. Authentication errors, rate limits and overload return to human review; retry deliberately after addressing the condition.
- Default 10-second timeout, maximum 30 seconds through the API; 16 KiB request and 64 KiB response caps.
- Reject missing/extra answers, wrong question types, non-numeric/out-of-range values, malformed usage, missing model IDs and mismatched pinned versions.
- No raw provider error body, transport error, API key or echoed payload is stored in evidence.
- Candidate, policy, checks and decisions are checked again after the response. CLI input-file changes abort persistence. Output paths reject escapes and outside-project symlinks.

A local JSON record remains editable and is not a signed attestation. The adapter performs a real model request when explicitly called, but downstream validation alone cannot prove the saved record is authentic. Trusted integrations still own authenticated actors, protected policy, complete Git scope, sensitive-code scanning, actual test execution, evidence integrity and external-action authorization.

## TypeScript

```ts
import { runJevReview, saveJevReview } from "deliveryguard/jev";
import type { ReviewPolicy, ReviewRecord } from "deliveryguard";

declare const policy: ReviewPolicy;
declare const record: ReviewRecord;
const root = process.cwd();
const output = ".deliveryguard/reviews/jev-run-001";
const result = await runJevReview(root, policy, record, {
  ...(process.env.TYPESAFE_API_KEY ? { apiKey: process.env.TYPESAFE_API_KEY } : {}),
  evidencePath: `${output}/evidence.json`,
});
const path = saveJevReview(root, output, policy, record, result);
// Inspect result.status; never treat human-required as approval.
```

Validate configuration and reserve a new output location before requesting evaluation. In TypeScript projects with `exactOptionalPropertyTypes`, omit `apiKey` when the environment variable is absent. Transport injection is for trusted tests/integrations, never a candidate-controlled option. No API key is bundled.

## Official contract and verification

The adapter was implemented against the [official HTTP API reference](https://docs.typesafe.ai/api), [Noul definition](https://docs.typesafe.ai/primitives/noul) and [model reference](https://docs.typesafe.ai/models), checked on 2026-09-21. Contract tests use synthetic provider responses and do not contact TypeSafe. A successful mocked test is not a successful live account call; configure a key and use an authorized non-sensitive candidate to establish live evidence.
