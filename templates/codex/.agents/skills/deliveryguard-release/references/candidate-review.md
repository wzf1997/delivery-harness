# Candidate review before delivery

Read the configured review policy and active record list. Prepare one complete candidate containing task summary, acceptance criteria, task and document revision, actual author, repository, branch, diff base, commit, tree, environment and all changed paths. A trusted adapter must derive scope and sensitive findings from real code, not author claims.

Use `deliveryguard review digest` to obtain candidate and policy hashes. Never invent a decision. Collect checks and an authenticated human decision or eligible automatic result through the project integration, then run `deliveryguard review validate` and `deliveryguard check`. Keep historical human rejections; address feedback in a revised candidate. Reuse decisions only while both digests and validity periods match.

Hotfix is an explicitly enabled bug-restoration path for test or staging only; it retains mandatory checks. Automatic review requires configured scope, risk and size limits and fresh evidence; uncertainty returns to human review. Integration requires independently verified remote parents, a reconstructed merge tree, conflict-only resolution changes and a human decision. The core validates records, not the truth of remote or model observations.

Before an authorized external action, recheck the actual tree, refs, evidence integrity and authenticated identity using the trusted adapter. Record push, deployment, acceptance and release independently. A successful offline check never grants external authority.

If the project explicitly selects the optional Jev adapter, use `deliveryguard review jev` to preview the complete summary payload first. Only `--send` contacts the provider using an environment-provided key. Check free text for confidential content before sending. Missing credentials, invalid responses or low probabilities require human review. Register and validate the new output record explicitly; do not mistake summary assessment for source-code review. Core `check` stays offline.
