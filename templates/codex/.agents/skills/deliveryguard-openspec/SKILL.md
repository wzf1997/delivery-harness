---
name: deliveryguard-openspec
description: Keep a DeliveryGuard version linked to a complete OpenSpec change without claiming implementation early.
---

# DeliveryGuard OpenSpec

Use `openspec/changes/<change-id>/proposal.md` and `tasks.md` as the minimum change artifacts. Set the version's OpenSpec status to `ready` only when both exist, and to `applied` only when no unchecked tasks remain. OpenSpec describes intent; source commits and tests remain separate evidence. Run `deliveryguard check` before reporting the change ready.
