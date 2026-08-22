# 架构

[English](architecture.md)

DeliveryGuard 是文件驱动的校验工具。它读取仓库内事实、推导生命周期阶段，并为开发者、CI 和 Coding Agent 输出诊断；本身不包含网络连接器或特权运行时。

## 分层

1. **公共 Schema**：使用 JSON Schema Draft 2020-12 定义配置、版本、证据和 Repair Case。
2. **语义校验器**：检查唯一标识、完整文档覆盖、仓库引用、OpenSpec 状态、red/green 提交和生产部署覆盖。
3. **阶段推导**：从事实计算 `planned`、`specified`、`implemented`、`verified` 或 `released`，不接受人工覆盖。
4. **CLI 与 TypeScript API**：共享同一套校验器，`--json` 是自动化集成接口。
5. **Harness 层**：安装后的 `AGENTS.md`、[Codex Skill 套件](codex-skills.zh-CN.md)与 OpenSpec 共同约束 Agent 如何准备事实，但不能绕过核心门禁，也不能代表核心执行外部写入。

## 门禁模型

- `specified`：存在唯一主文档，并满足配置中的 OpenSpec 策略。
- `implemented`：每个必需仓库都有已提交或已合并的源码记录。
- `verified`：实现已就绪、验收为 `passed`、全部文档与需求被覆盖、所有用例通过且证据文件存在。
- `released`：在需要时已经验收，每个必需仓库都有成功的生产部署，并存在具体发布锚点和时间。

验收与发布始终是两类独立事实。生产部署失败不会抹掉此前的验收证据。

## 信任边界

所有文件路径必须相对仓库。Repair 命令属于不可信仓库内容，只有显式执行 `repair run` 才会运行，`check` 永不执行命令。命令以 argv 数组直接传给操作系统，固定 `shell: false`，并限制工作目录和超时。

文档引用、部署锚点和远程仓库 URL 是不透明证据。DeliveryGuard 只校验其存在性与关系，不代替外部系统鉴权。
