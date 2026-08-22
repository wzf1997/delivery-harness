---
name: deliveryguard-acceptance
description: Build and validate document-to-requirement-to-case acceptance evidence with DeliveryGuard.
---

# DeliveryGuard Acceptance

Read [references/execution-checklist.md](references/execution-checklist.md) before running cases and [references/evidence-and-conclusions.md](references/evidence-and-conclusions.md) before stating a result. Use [assets/report-template.md](assets/report-template.md) when a report is requested.

Map every registered document to requirements and every requirement to executable cases. A passing or failing case needs a real repository-relative evidence file. A blocked or skipped case needs a concrete note. Keep acceptance `pending`, `failed`, or `blocked` while coverage is incomplete. Run `deliveryguard acceptance validate` and `deliveryguard check` before recording `passed`.
