# Fixture scenario matrix

For each scenario record:

| Field | Purpose |
| --- | --- |
| Scenario ID | Stable synthetic identifier |
| Initial state | State before the test action |
| Transition | One authorized state change |
| Expected effects | Records, events, or calls that should result |
| Forbidden effects | Effects that must not occur |
| Idempotency key | Safe replay boundary |
| Evidence query | Read-only observation used for verification |
| Cleanup or expiry | How the fixture stops affecting the environment |

Keep happy path, boundary, retry, duplicate, unauthorized, and rollback cases distinct.
