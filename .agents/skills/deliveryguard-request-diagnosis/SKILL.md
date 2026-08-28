---
name: deliveryguard-request-diagnosis
description: Diagnose page, API, and multi-service request failures from the first failing boundary without authorizing repairs or external changes.
---

# Request diagnosis

Use this skill for a page action, API call, gateway request, webhook, or multi-service flow that returned an error, timed out, or produced an unexpected state. Diagnosis is read-only. Do not edit code, change configuration, deploy, replay a mutating request, or write external data unless the user separately authorizes that action.

## Establish the request

Record the user action, environment class, approximate time window, entry route or operation, expected result, observed result, and any request or trace identifier. Redact credentials, personal data, private hosts, and unnecessary payload values from saved evidence.

Keep these observations separate:

- user-visible page or client state;
- transport status such as HTTP status, timeout, or connection failure;
- application or business-envelope status carried inside a successful transport response;
- downstream service, queue, database, or dependency status.

An outer success can contain an inner failure, and the final error does not identify the root cause by itself.

## Find the first failing boundary

When a trace identifier is available, follow the trace from the entry span toward downstream spans. Find the earliest boundary where the observed result first diverges from the expected result. Capture the relevant parent and child operations, timestamps, status or error fields, and a small redacted evidence excerpt. Do not blame the final component merely because it returned the user-facing error.

When no trace identifier is available, use a bounded client Network capture, a narrow time-window log correlation, and a comparison with a healthy sibling request when available. Correlate by non-secret request attributes and timing. Label the conclusion as lower confidence, state what could not be correlated, and never invent a trace relationship.

Compare the failing request with the nearest healthy equivalent across route, method, headers or identity class, validated parameters, deployment version, data state, downstream selection, and timing. Stop once the first evidence-backed divergence is found; later failures are usually consequences until proven otherwise.

## Classify and report

Classify the likely cause as one of:

- routing;
- authentication or authorization;
- parameter or validation;
- application code;
- data state or data integrity;
- downstream dependency;
- deployment or version skew;
- infrastructure.

Return:

1. **First failing boundary** — the component or transition and the exact observed divergence.
2. **Evidence** — trace/span, network, log, or comparison facts, with sensitive values redacted.
3. **Root-cause classification** — category, confidence, and why the evidence supports it.
4. **Verified and unverified** — what was checked and which layers or hypotheses remain open.
5. **Next step** — the smallest safe confirmation or repair step, clearly noting any new authorization it needs.

If no boundary is proven, say `blocked` or `inconclusive`; do not promote the most convenient hypothesis to a confirmed root cause.
