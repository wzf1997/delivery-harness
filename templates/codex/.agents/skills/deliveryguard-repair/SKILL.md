---
name: deliveryguard-repair
description: Record and verify reproducible red-green-regression repair cases with DeliveryGuard.
---

# DeliveryGuard Repair

Use a Repair Case for a real, reproducible defect. Keep commands as argv arrays and repository paths relative. `verified` requires a failing baseline commit, a different passing candidate commit, and passing regression checks. Do not treat configuration, data, dependency, or test-infrastructure failures as code fixes. Validate the case before running any command.
