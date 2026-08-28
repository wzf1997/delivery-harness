# Codex skills

`deliveryguard init --codex` installs 19 repository-local skills. They are clean-room, provider-neutral rewrites of recurring delivery practices; no private connector, endpoint, environment coordinate, business schema, account, or production action is included.

DeliveryGuard dogfoods the suite from [`.agents/skills`](../.agents/skills). The packaged initializer mirror lives under `templates/codex`; automated tests reject any difference between the two trees.

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
| `deliveryguard-request-diagnosis` | Find the first failing boundary in page, API, and multi-service requests |
| `deliveryguard-real-device-test` | Route authorized Android and iOS real-device validation |

## Safety boundary

The skills may inspect files, prepare plans, create local records, and run DeliveryGuard validation. They do not provide deployment, gateway, database, messaging, CDN, device-farm, Mobile MCP, Appium, or enterprise-document connectors. The real-device skill can use Mobile MCP or a local Appium/XCUITest toolchain already available in the consuming environment, but it neither installs nor configures those capabilities by default. Device changes and all other external writes still require explicit authorization and independently verifiable evidence.

Initialization refuses to overwrite any existing file. Teams that already have a skill with the same name should review and merge the guidance manually.
