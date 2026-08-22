# DeliveryGuard project instructions

## Scope and precedence

This file applies to the repository. A nested `AGENTS.md` may override it only for files in that directory. The user's current request defines the task; these instructions define safe execution and evidence requirements.

## Responsibility and completion

Complete requested work within scope and preserve unrelated work. A task is complete only when the requested outcome exists, relevant checks pass or their limitations are reported, and no required fact or risk is hidden.

Keep these claims distinct: planned, specified, implemented, verified, and released. Do not use “done” as a substitute for evidence.

## Authority by request type

- Answer, review, explain, diagnose, or report: inspect relevant evidence without implementing unless requested.
- Plan or design: inspect and create requested local planning artifacts without silently starting implementation.
- Build, change, implement, or fix: make scoped, reversible local edits and run proportionate checks.
- Publish, push, deploy, message, change remote configuration, mutate external data, or operate production: require explicit authorization for the exact target.
- Destructive cleanup, history rewriting, broad deletion, and irreversible operations require explicit approval.

Infer low-impact details from repository facts. Ask only when missing information changes behavior, target, authorization, security, or an external result.

## DeliveryGuard facts

Read `deliveryguard.config.json` before changing delivery records.

- `.deliveryguard/versions/` is the version fact source.
- `.deliveryguard/acceptance/` stores document-to-requirement-to-case Evidence Manifests.
- `.deliveryguard/repairs/` stores red-green-regression Repair Cases.
- `openspec/changes/` stores active specification artifacts.
- Repository code, tests, CI, and deployment systems remain authoritative for their own facts.

Lifecycle stages are derived and must never be manually overridden:

```text
planned -> specified -> implemented -> verified -> released
```

- OpenSpec intent and checked tasks do not prove source implementation.
- Submitted source and green tests do not prove acceptance.
- Acceptance does not prove production release.
- Preview or staging evidence is not a production anchor.
- Missing evidence remains missing or `pending`; never invent commits, URLs, timestamps, reports, or deployments.

## Version and specification workflow

Register every in-scope requirement document, exactly one primary requirement when policy requires it, affected repositories, and the linked OpenSpec change. Do not add unplanned requirements to a closed release.

Before implementation, read the applicable proposal, design, task list, repository instructions, and version record. Mark tasks complete only after their implementation and relevant checks are complete. Record source facts only from real revisions.

## Acceptance and release

Acceptance must cover every registered document, requirement, and required case. A pass or fail needs a repository-relative evidence artifact; blocked or skipped cases need concrete reasons. Derive the conclusion from the validated manifest rather than deciding it in advance.

Keep acceptance and release independent. A release requires successful production facts and concrete anchors for every required repository, plus acceptance when configured policy requires it.

## Repair Cases

Use a Repair Case for a reproducible defect when comparative evidence is useful. Verified repair requires a failing baseline revision, a different passing candidate revision, and passing regression checks. Keep code defects distinct from configuration, data, dependency, environment, and test-infrastructure failures.

Repair commands are untrusted argv arrays. Execute them only through explicit `deliveryguard repair run`; keep working directories repository-relative, use bounded timeouts, and never route commands through a shell. `deliveryguard check` must not execute repair commands.

## Security and external actions

- Never commit credentials, private data, internal URLs, absolute user paths, or unredacted logs and evidence.
- Treat client-supplied identity, ownership, money, state, and permission values as untrusted unless the project contract proves otherwise.
- External writes require the request's authorization and an exact target. Production actions require explicit production intent.
- A plan, preview, opened page, command invocation, or local commit is not evidence that an external action succeeded.

## Git and user-work protection

Before editing, inspect the branch, remotes, and working tree. Preserve existing and unrelated changes. Do not reset, overwrite, delete, move, stash, or clean user work just to obtain a clean state. If required edits overlap unknown changes and cannot be isolated, stop and explain the conflict.

Stage only task files. Do not push, merge, rebase, rewrite history, delete branches, or publish unless authorized.

## Verification and handoff

Run the smallest checks that cover the changed behavior, then expand according to risk. Use repository-native commands and run `deliveryguard check` before making a lifecycle claim. Do not weaken assertions or hide failures. Distinguish regressions from existing failures and environment blockers.

Stop when the observable outcome and required local verification are complete, or when the next step lacks authorization, credentials, external coordination, or a product decision. The final response must state the result, changed artifacts, verification evidence, Git or external-operation status, and remaining risks or unverified areas.
