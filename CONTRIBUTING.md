# Contributing

[简体中文](CONTRIBUTING.zh-CN.md)

Issues and pull requests are welcome. Keep changes focused, include tests for behavior, and update affected English and Chinese core documentation together.

## Development

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm check:sensitive
```

Node `^22.19.0 || >=24.0.0` and pnpm 11 are required. Run `pnpm check` before opening a pull request.

Use synthetic fixtures only. Do not submit private documents, production URLs, credentials, personal data, internal repository names, real deployment anchors, or screenshots from non-public systems. Repair commands must remain argv arrays and must never use a shell wrapper.

Schema and CLI changes require a Changeset and migration notes when they affect consumers. Commit messages should explain the user-visible reason for the change.
