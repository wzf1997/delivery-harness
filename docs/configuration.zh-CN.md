# 配置参考

[English](configuration.md)

`deliveryguard.config.json` 是项目入口，所有配置路径均相对仓库根目录。

- `project`：稳定项目 ID 与展示名称。
- `stableBranch`：项目真实稳定分支；DeliveryGuard 不假设一定是 `main` 或 `master`。
- `repositories`：参与交付的源码仓库；必需仓库会进入实现和生产门禁。
- `environments`：开发、测试、预发或生产环境。
- `documentTypes`：版本记录允许使用的项目文档类型。
- `paths`：版本、验收、修复和 OpenSpec 的存放位置。
- `policies.requireOpenSpec`：进入 `specified` 前必须有 ready 或更晚状态的 OpenSpec change。
- `policies.requireAcceptanceBeforeRelease`：没有完整验收时不能进入 `released`。
- `policies.requireDedicatedWorktree`：供 Agent 指令读取的协作策略；校验器不会创建或删除 worktree。

## 记录

每个版本使用一个 JSON 文件。源码和部署记录按仓库分别保存；部署环境必须在配置中登记，提交使用 7–40 位十六进制 SHA，发布记录必须包含非 `pending` 的具体锚点。

证据清单必须覆盖全部登记文档。每份文档映射到需求，每条需求映射到用例；通过或失败用例必须引用真实证据文件，阻塞或跳过用例必须说明原因。

Repair Case 只允许仓库相对路径和 argv 数组。执行前 runner 会确认目标仓库当前 HEAD 与该阶段声明的提交一致。
