# DeliveryGuard repository instructions

## Scope and precedence

This file applies to the entire repository. A nested `AGENTS.md` may add or override rules only for its own directory. The user's current request controls the task; repository instructions define how to perform it safely and how to prove completion.

DeliveryGuard is a public, clean-room delivery validation toolkit. Keep code, documentation, examples, tests, and history suitable for public release.

## Responsibility and success

Complete requested code, schemas, documentation, tests, and local validation within the authorized scope. Work is complete only when the requested outcome exists, relevant checks pass or are accurately reported, unrelated work is preserved, and remaining risks or external blockers are explicit.

Do not confuse a plan, an edited file, a submitted source revision, successful tests, acceptance, deployment, or release. Each claim needs its own evidence.

## Authority by request type

- For answers, reviews, explanations, diagnoses, and status reports, perform relevant read-only inspection; do not implement a fix unless requested.
- For planning and design, inspect the repository and create requested local artifacts; do not silently begin implementation.
- For build, change, implement, or fix requests, make scoped, reversible local edits and run proportionate verification.
- Publishing, pushing, deploying, messaging, changing remote configuration, mutating external data, or acting in production requires explicit authorization for the exact target.
- Destructive cleanup, history rewriting, force pushes, broad deletion, and irreversible migrations require explicit approval.

Infer low-impact details from repository facts. Ask only when missing information changes behavior, target, authorization, security, or an external result.

## Repository map and facts

- `deliveryguard.config.json` defines repositories, environments, paths, document types, and policies.
- `.deliveryguard/versions/` contains version facts; `.deliveryguard/acceptance/` contains Evidence Manifests; `.deliveryguard/repairs/` contains Repair Cases.
- `openspec/changes/` contains active specification changes.
- `schemas/` is the public JSON Schema contract. Keep it aligned with `src/types.ts`, semantic validation, examples, and documentation.
- `src/` contains the TypeScript API and CLI. `dist/` is generated output.
- `examples/synthetic-shop/` is the end-to-end fixture and must remain wholly synthetic.
- `.agents/skills/` is the repository-discoverable skill suite. `templates/codex/.agents/skills/` is the npm initializer mirror; tests require byte-for-byte equality.
- `templates/default/` contains files installed by `deliveryguard init`. Never make initialization overwrite existing user files.

Use pnpm only. Support the Node range declared in `package.json`.

## Delivery fact contract

Lifecycle stages are derived from facts and are never manually overridden:

```text
planned -> specified -> implemented -> verified -> released
```

- A version is `specified` only when its registered documents and required OpenSpec artifacts are valid.
- OpenSpec records intent and task completion; it is not source, acceptance, or release evidence.
- A version is `implemented` only when every required repository has qualifying source facts.
- Acceptance requires complete document-to-requirement-to-case coverage and repository-relative evidence.
- Acceptance and production release are independent facts. Tests or acceptance must never imply release.
- A release requires successful production facts and concrete anchors for every required repository, plus acceptance when policy requires it.

Record only facts that exist. Missing evidence stays missing or `pending`; do not invent branches, commits, URLs, timestamps, reports, or deployment anchors.

## Repair Cases

Use a Repair Case for a reproducible defect when red-green-regression evidence is meaningful. A verified repair requires a failing baseline revision, a different passing candidate revision, and passing regression checks. Keep configuration, data, dependency, environment, and test-infrastructure failures distinct from code defects.

Repair commands are untrusted argv arrays. Execute them only through an explicit `deliveryguard repair run`, with repository-relative working directories, bounded timeouts, and `shell: false`. `deliveryguard check` must never execute repair commands.

## Public and security boundaries

- Keep examples, screenshots, evidence, names, URLs, identifiers, and commits fictional or explicitly public. Use `.invalid` domains for synthetic hosts.
- Never copy proprietary source, private documents, messages, screenshots, production data, credentials, internal repository history, or absolute user paths.
- Do not add deployment, messaging, business-data, credential, or proprietary platform integrations to the core.
- Bundled skills may describe provider-neutral plans and evidence contracts, but must not embed private adapters, endpoints, environment coordinates, business schemas, or automatic external writes.
- All accepted project paths must be repository-relative and constrained to the selected root.

## Git and user-work protection

Before editing, inspect the current branch, remotes, and working tree. Preserve existing and unrelated changes. Do not reset, overwrite, delete, move, stash, or clean user work merely to obtain a clean tree. If required edits overlap unknown changes and cannot be isolated, stop and explain the conflict.

Stage only task files. Do not push, merge, rebase, rewrite history, delete branches, or publish unless the current request authorizes that action.

## Verification

Start with the smallest check that covers the changed behavior, then expand with risk. Keep schemas, semantic validators, CLI output, tests, templates, examples, and bilingual core documentation consistent.

Before completing a release-relevant change, run:

```sh
pnpm check
node dist/cli.js -C examples/synthetic-shop check
pnpm pack
```

Smoke-test the packed artifact in a clean temporary project when package contents or initialization change. Validate every changed Skill and confirm `.agents/skills` matches the packaged template. Run workspace and Git-history secret scans before public release.

Never weaken assertions or hide failures to make checks pass. Distinguish a product regression from an existing failure or environment blocker. State any check not run and why.

## Stop and handoff

Stop when the requested observable outcome and required local verification are complete, or when the next step needs missing authorization, credentials, external coordination, or a product decision. Use at most a small number of relevant fallback checks before reporting an infrastructure blocker.

Final responses should lead with the result and include changed artifacts, verification evidence, Git or external-operation status, and any remaining risk. Never describe an attempted command, opened page, draft, preview, or local commit as a published or released result.
