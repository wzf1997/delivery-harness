# Review workflows

[中文](review-workflows.zh-CN.md)

DeliveryGuard can validate a complete delivery candidate against a separately supplied review policy. This optional gate complements the existing version, acceptance, repair, and release gates. It does not change lifecycle derivation, approve an identity, contact a model, fetch Git refs, push code, or deploy anything.

## Quick start

From this repository after building:

```sh
node dist/cli.js -C examples/synthetic-shop review digest reviews/hotfix.json --policy reviews/policy.json
node dist/cli.js -C examples/synthetic-shop review validate reviews/hotfix.json --policy reviews/policy.json --json
node dist/cli.js -C examples/synthetic-shop check
```

The example contains explicitly fictional commits and evidence. A successful result demonstrates the validator, not a real review or release. `digest` only prints identifiers; it never manufactures decisions. `validate` returns exit 0 for consistent evidence, 1 for a blocked gate, and 2 for an input/CLI error. Its result always includes `authorizesExternalAction: false`.

For a consuming project, use the same commands through `deliveryguard`. Register active records in `deliveryguard.config.json` to include them in every `check`:

```json
{
  "review": {
    "policy": ".deliveryguard/review-policy.json",
    "records": [".deliveryguard/reviews/current.json"]
  }
}
```

This is a fragment to add to the existing configuration. Both files must exist; missing registered records fail the check. Without `review`, existing projects behave as before. Only registered records are checked, so the caller must protect this list against omission. Archive old decisions separately; expired historical reviews should not remain in the active list. In project checks, repository IDs and environment kinds must also agree with the project configuration. Passing reviews never promote a version to accepted or released.

## Candidate and policy

The public contracts are [review-policy.schema.json](../schemas/review-policy.schema.json) and [review-record.schema.json](../schemas/review-record.schema.json). The record contains:

- One complete candidate: task summary, acceptance criteria, task and document revisions, author, repository, development branch, diff base, commit, tree, target environment, workflow mode, complete changed-file list and sensitive findings.
- Check results bound to the candidate digest, including repository-relative evidence paths.
- Human or automatic decisions bound to both candidate and policy digests, with creation and expiry times and evidence paths.

`reviewDigest` uses SHA-256 over recursively key-sorted compact JSON; array order is significant. Do not hash the enclosing record. Use the API or CLI to obtain the digests. Any candidate change invalidates all old checks and approvals. Any policy content change invalidates old approvals even if its revision label was not updated. Decisions are combined plan-and-code reviews rather than separate plan and code approvals.

Policies select the bound repository, development branch, environments, file scope, mandatory checks, human reviewers and optional fast paths. Path entries are exact paths or directory prefixes, **not globs**: `src/ui` includes `src/ui/button.ts`, but not `src/ui-other.ts`. Paths use normalized forward slashes; absolute paths, traversal and backslashes are rejected. Include both old and new names for renames. Evidence and input reads reject symlinks escaping the project root and require regular files.

## Routes

| Route | Required evidence and limits |
| --- | --- |
| Human | Current approval from a policy-listed reviewer other than the candidate author; all required checks pass. |
| Hotfix | Explicitly enabled policy; bug restoring documented behavior; no product-rule change; test or staging only; same source, file-scope and check gates. No review approval is required. |
| Automatic | Explicitly enabled policy; ordinary non-production delivery; no rule change or sensitive findings; allowed, non-excluded paths; bounded file/line counts; model identifier, scores meeting policy thresholds and unexpired decision within the policy age limit. |
| Integration | Non-production only; ordered target/source parents, distinct heads and branches, resolution paths contained in declared conflicts and candidate files, remote observation no older than one hour, evidence artifact and human approval. |

Missing, malformed, future-dated, expired or below-threshold automatic evidence requires a human approval. A current candidate's human rejection blocks all routes, including Hotfix, even if the rejection expired or the policy changed. Prepare a revised candidate (with an honest new task revision when addressing non-code feedback) for another review; do not erase the rejection. Automatic approvals can never substitute for integration review or production approval. Hotfix must become an ordinary delivery candidate before production, with fresh checks and approval; normal acceptance and release gates still apply.

Automatic thresholds are policy inputs, not universal safety probabilities. Defaults in the synthetic policy illustrate a conservative configuration; automated review is disabled there. Scores alone never bypass the deterministic gates. The validator does not perform a sensitive-code scan or assess whether a bug really preserves existing behavior.

## Adapter contract and trust boundary

A trusted external adapter must authenticate the author and reviewer, read the protected policy, collect the complete Git diff from the explicit base, check task ownership and scope, obtain the actual document revision, execute checks, scan sensitive changes and retain the resulting evidence. Do not trust candidate-supplied identity, file lists, line counts, findings, scores or environment labels. Protect policy, configuration and record writes separately from candidate authors.

For integrations, the adapter must freshly fetch the target and source refs, verify the candidate's actual two-parent graph, reconstruct Git's automatic merge tree, and compute resolution changes against that tree. It must reject unresolved conflicts, extra commits, unexpected parents and edits outside actual conflicts. The core checks consistency of the supplied observations; it does **not** reconstruct the merge or prove a remote branch exists. The candidate `branch` remains the policy's development branch; `integration.targetBranch` records the test target. A provider-specific temporary conflict branch belongs to the adapter.

The core checks that evidence files exist; it does not authenticate signatures, inspect evidence contents, prove model execution, re-read the current working tree, or establish remote freshness beyond the recorded time. A modified evidence file is not detected by the candidate digest. For enforcement, an adapter must verify evidence integrity, compare the recorded tree and refs with the actual objects immediately before acting, and enforce independent authorization. Re-evaluate with the real clock; API time injection is intended for deterministic tests. An optional [Jev adapter](jev.md) can produce model evidence through an explicit request. No credential store, organization role, messaging or deployment connector is included; the validator remains offline.

## Handoff and repeated work

Read existing handoff facts before creating new ones. A handoff should retain the task and document revision, branch, exact commit, covered files, unresolved gaps and remote-verification evidence. Reuse a commit only if it covers the requested scope and a fresh remote check proves it is reachable; it need not equal the remote tip. Reuse an identical snapshot. Append a new snapshot when materials change, retaining old evidence. An initial requirement without code does not need an empty commit.

Recheck task-related staged, unstaged and untracked changes without clearing unrelated work. Separate authorization to implement, commit, push and deploy; reuse an existing authorization only for the same action and scope. A gate rejection is a review problem, not proof of missing user authorization. Document revisions must come from the actual provider; this offline core intentionally provides no provider-specific revision lookup. Handoff guidance is procedural, not a new authenticated handoff service.

## TypeScript API

```ts
import { reviewDigest, validateReview } from "deliveryguard";
import type { ReviewPolicy, ReviewRecord } from "deliveryguard";

// Load policy and record from a trusted adapter, not from an untrusted author.
declare const policy: ReviewPolicy;
declare const record: ReviewRecord;
const candidateDigest = reviewDigest(record.candidate);
const policyDigest = reviewDigest(policy);
const result = validateReview(process.cwd(), policy, record);
// result.ok describes evidence consistency, never permission to push or deploy.
```
