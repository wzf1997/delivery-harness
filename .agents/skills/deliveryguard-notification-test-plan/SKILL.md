---
name: deliveryguard-notification-test-plan
description: Build a traceable state-transition matrix for testing notifications without sending messages or mutating data.
---

# Notification test plan

Derive notification scenarios from the current state machine and recipient rules. For each scenario, define the triggering transition, eligible recipient class, deduplication key, template variables, suppressed cases, expected delivery record, and observable evidence. Separate fixture preparation, event triggering, platform delivery, and user-visible receipt. Use synthetic recipients only. DeliveryGuard does not send messages or drive state changes; those actions require explicit project adapters and authorization.
