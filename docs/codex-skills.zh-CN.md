# Codex Skills

`deliveryguard init --codex` 会安装 17 个仓库级 Skill。它们是对常用交付实践的 clean-room、供应商无关重写，不包含私有连接器、端点、环境坐标、业务 Schema、账号或生产操作。

DeliveryGuard 自身使用 [`.agents/skills`](../.agents/skills) 中的这套 Skill。npm 初始化模板镜像位于 `templates/codex`；自动化测试会拒绝两个目录之间的任何差异。

| Skill | 用途 |
| --- | --- |
| `deliveryguard-version` | 登记版本范围与需求文档 |
| `deliveryguard-openspec` | 路由 OpenSpec 生命周期 |
| `deliveryguard-openspec-explore` | 只探索问题，不进入实现 |
| `deliveryguard-openspec-propose` | 创建提案与可验证任务 |
| `deliveryguard-openspec-apply` | 实现任务并登记真实源码事实 |
| `deliveryguard-openspec-archive` | 收口已完成的规格流程 |
| `deliveryguard-acceptance` | 执行证据驱动验收 |
| `deliveryguard-acceptance-handoff` | 准备验收交接稿，不发送消息 |
| `deliveryguard-repair` | 管理 red/green/regression 修复证据 |
| `deliveryguard-release` | 根据生产锚点完成发布收口 |
| `deliveryguard-route-review` | 识别路由变更并准备注册计划 |
| `deliveryguard-fixture-plan` | 设计确定性的非生产测试夹具 |
| `deliveryguard-notification-test-plan` | 设计状态驱动的通知测试场景 |
| `deliveryguard-data-review` | 约束只读交付证据查询 |
| `deliveryguard-admin-import-plan` | 校验层级化导入计划 |
| `deliveryguard-knowledge-capture` | 沉淀脱敏的仓库内知识 |
| `deliveryguard-artifact-intake` | 校验并登记本地证据制品 |

## 安全边界

这些 Skill 可以检查文件、准备计划、创建本地记录并运行 DeliveryGuard 校验，但不提供部署、网关、数据库、消息、CDN、真机平台或企业文档连接器。使用方可以在自己的仓库中增加适配器；任何外部写入仍需明确授权，并保留可独立验证的证据。

初始化不会覆盖已有文件。如果目标仓库已存在同名 Skill，应人工审阅并合并规则。
