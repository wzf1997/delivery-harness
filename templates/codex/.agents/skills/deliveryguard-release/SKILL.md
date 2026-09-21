---
name: deliveryguard-release
description: Close a DeliveryGuard release only from concrete acceptance and production deployment evidence.
---

# DeliveryGuard Release

Treat acceptance and release as separate gates. Record one deployment fact per required repository and environment, including branch, commit, result, timestamp, and a concrete pipeline or deployment anchor. Never infer production release from preview, source submission, or test success. Run `deliveryguard check`; only a derived `released` stage supports a release claim.

When candidate review workflows are enabled, first follow [candidate review](references/candidate-review.md). A review pass never substitutes for acceptance, production deployment evidence or external-action authorization.
