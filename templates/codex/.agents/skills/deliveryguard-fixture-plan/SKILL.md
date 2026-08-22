---
name: deliveryguard-fixture-plan
description: Design safe, deterministic non-production test fixtures and their cleanup and evidence contracts.
---

# Test fixture plan

Read [references/scenario-matrix.md](references/scenario-matrix.md) when the fixture spans multiple states or downstream effects. Define the target environment, synthetic identifiers, initial state, allowed transitions, idempotency key, expected side effects, cleanup or expiry, and evidence query before execution. Refuse production targets and real customer data. This public skill produces a plan only; data writes require a repository-owned adapter and explicit authorization at execution time.
