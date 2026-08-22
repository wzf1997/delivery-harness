---
name: deliveryguard-openspec
description: Coordinate an OpenSpec change across exploration, proposal, implementation, and archive while keeping DeliveryGuard facts honest.
---

# DeliveryGuard OpenSpec

Route the request to the matching `deliveryguard-openspec-*` skill. Use `openspec/changes/<change-id>/proposal.md` and `tasks.md` as the minimum change artifacts. Set the version's OpenSpec status to `ready` only when both exist, and to `applied` only when no unchecked tasks remain. OpenSpec describes intent; source commits, acceptance, and deployment remain separate evidence. Run `deliveryguard check` before reporting a lifecycle claim.
