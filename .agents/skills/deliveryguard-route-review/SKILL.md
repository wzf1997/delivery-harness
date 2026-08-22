---
name: deliveryguard-route-review
description: Review changed application routes and prepare a provider-neutral environment registration plan without mutating gateways.
---

# Route review

Compare the task diff with its base commit and identify newly added or materially changed runtime routes. Exclude declarations, tests, documentation, SQL, deleted files, and routes that are not externally reachable. For each candidate, record the normalized path, owning repository, authentication class, target environments, and evidence needed after registration.

This public skill never creates or synchronizes gateway entries. If a repository supplies its own adapter, present the exact plan and obtain authorization before any external write. Record the resulting anchor in DeliveryGuard only after independently verifying it.
