---
name: deliveryguard-acceptance
description: Build and validate document-to-requirement-to-case acceptance evidence with DeliveryGuard.
---

# DeliveryGuard Acceptance

Choose the smallest mode that matches the request:

- For a focused page, API, defect, or small set of checks, read [references/local-verification.md](references/local-verification.md). Do not start or update formal version acceptance merely because the word "test" was used.
- For full acceptance of one registered version, read [references/execution-checklist.md](references/execution-checklist.md) before running cases and [references/evidence-and-conclusions.md](references/evidence-and-conclusions.md) before stating a result.
- For a report-only review or handoff, use `deliveryguard-acceptance-handoff` and preserve the manifest's existing case states. Use [assets/report-template.md](assets/report-template.md) only when a report is requested.

Map every registered document to requirements and every requirement to executable cases. A passing or failing case needs a real repository-relative evidence file. A blocked or skipped case needs a concrete note. Keep acceptance `pending`, `failed`, or `blocked` while coverage is incomplete. Run `deliveryguard acceptance validate` and `deliveryguard check` before recording `passed`.

Keep evidence layers independent. A blocked device, account, environment, or tool stops only the cases that require it; continue deterministic and otherwise independent checks within the authorized scope. Success at a local or lower layer does not promote a formal acceptance result.
