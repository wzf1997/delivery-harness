# 参与贡献

[English](CONTRIBUTING.md)

欢迎提交 Issue 和 Pull Request。改动应聚焦，行为变化需要测试，受影响的中英文核心文档必须同步更新。

## 本地开发

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm check:sensitive
```

项目要求 Node `^22.19.0 || >=24.0.0` 与 pnpm 11。提交 PR 前运行 `pnpm check`。

只能使用合成测试数据。不得提交私有文档、生产地址、凭据、个人信息、内部仓库名、真实部署锚点或非公开系统截图。Repair 命令必须保持 argv 数组，禁止用 shell 包装执行。

影响使用方的 Schema 或 CLI 变更必须附带 Changeset 和迁移说明。提交信息应说明改动对用户的实际意义。
