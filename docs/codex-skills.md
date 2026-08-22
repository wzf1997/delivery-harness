# Codex skills

`deliveryguard init --codex` installs 17 repository-local skills. They are clean-room, provider-neutral rewrites of recurring delivery practices; no private connector, endpoint, environment coordinate, business schema, account, or production action is included.

| Skill | Purpose |
| --- | --- |
| `deliveryguard-version` | Register version scope and source documents |
| `deliveryguard-openspec` | Route the OpenSpec lifecycle |
| `deliveryguard-openspec-explore` | Investigate without implementing |
| `deliveryguard-openspec-propose` | Create proposal and verifiable tasks |
| `deliveryguard-openspec-apply` | Implement and record real source facts |
| `deliveryguard-openspec-archive` | Close a completed specification workflow |
| `deliveryguard-acceptance` | Execute evidence-backed acceptance |
| `deliveryguard-acceptance-handoff` | Prepare a report handoff without messaging |
| `deliveryguard-repair` | Maintain red-green-regression repair evidence |
| `deliveryguard-release` | Close releases from production anchors |
| `deliveryguard-route-review` | Detect route changes and prepare registration plans |
| `deliveryguard-fixture-plan` | Design deterministic non-production fixtures |
| `deliveryguard-notification-test-plan` | Design state-driven notification scenarios |
| `deliveryguard-data-review` | Govern read-only delivery evidence queries |
| `deliveryguard-admin-import-plan` | Validate hierarchical import plans |
| `deliveryguard-knowledge-capture` | Capture sanitized repository-local learnings |
| `deliveryguard-artifact-intake` | Validate and register local evidence artifacts |

## Safety boundary

The skills may inspect files, prepare plans, create local records, and run DeliveryGuard validation. They do not provide deployment, gateway, database, messaging, CDN, device-farm, or enterprise-document connectors. A consuming repository may add its own adapter, but external writes still require explicit authorization and independently verifiable evidence.

Initialization refuses to overwrite any existing file. Teams that already have a skill with the same name should review and merge the guidance manually.
