# 交付候选审核流程

[English](review-workflows.md)

DeliveryGuard 新增可选的交付候选审核校验，与现有版本、验收、Repair 和发布检查一起使用。它不改变生命周期推导，不认证身份、不调用模型、不读取远端 Git，也不执行推送或部署。

## 运行示例

在本仓库完成构建后执行：

```sh
node dist/cli.js -C examples/synthetic-shop review digest reviews/hotfix.json --policy reviews/policy.json
node dist/cli.js -C examples/synthetic-shop review validate reviews/hotfix.json --policy reviews/policy.json --json
node dist/cli.js -C examples/synthetic-shop check
```

示例中的提交和证据全部虚构。通过只证明示例满足校验规则，不是真实审核、验收或发布。`digest` 只输出摘要，不生成批准。`validate` 的退出码为：0 表示证据一致，1 表示门禁阻断，2 表示输入或命令错误；结果始终包含 `authorizesExternalAction: false`。

使用方通过 `deliveryguard` 执行相同子命令。在已有 `deliveryguard.config.json` 中增加以下配置，即可纳入常规 `check`：

```json
{
  "review": {
    "policy": ".deliveryguard/review-policy.json",
    "records": [".deliveryguard/reviews/current.json"]
  }
}
```

这是配置片段，不能替代完整配置。登记的策略和记录必须存在，缺失时阻断。没有 `review` 配置的旧项目保持原行为。调用方需要保护登记清单，防止通过漏登记绕过检查；只检查清单中的记录。过期历史记录单独归档，清单保留当前候选。项目检查还核对仓库 ID、环境类型与项目配置是否一致。审核通过不会将版本推进到验收通过或已发布。

## 候选与策略

公共合同见 [review-policy.schema.json](../schemas/review-policy.schema.json) 和 [review-record.schema.json](../schemas/review-record.schema.json)。记录包括：

- 完整候选：任务摘要、验收条件、任务与文档修订、作者、仓库、开发分支、差异基线、提交、代码树、目标环境、流程模式、完整变更文件及敏感发现。
- 绑定候选摘要的检查结果和仓库相对证据路径。
- 同时绑定候选与策略摘要的人工或自动审核记录，包括创建时间、有效期和证据路径。

`reviewDigest` 对递归按键排序的紧凑 JSON 计算 SHA-256，数组顺序有意义。通过 API 或 CLI 获取摘要，不要对包含审核记录的整个文件计算候选摘要。候选任一字段变化都会使旧检查和批准失效；策略内容变化也会使旧批准失效，即使没有修改 revision。方案与代码作为一份完整候选审核，不再拆成两次批准。

策略定义仓库、开发分支、环境、文件范围、必需检查、审核人和可选快速通道。路径采用精确路径或目录前缀，**不是 glob**：`src/ui` 包含 `src/ui/button.ts`，不包含 `src/ui-other.ts`。路径必须使用规范正斜杠；拒绝绝对路径、目录穿越与反斜杠。重命名需包含新旧路径。输入与证据必须是项目内普通文件，拒绝指向项目外的符号链接。

## 三种交付方式与审核选择

| 路径 | 校验条件 |
| --- | --- |
| 人工审核 | 策略列出的审核人批准当前候选，审核人不能是作者；必需检查通过。 |
| Hotfix | 策略显式启用；恢复既有约定行为的 Bug；不改变产品规则；仅测试或预发；保留源码、范围和检查门禁，免除审核批准。 |
| 自动审核 | 策略显式启用；普通非生产交付；没有规则变更或敏感发现；文件属于允许范围且不命中排除项；文件数与行数不超限；模型标识、分数、有效期符合策略。 |
| 测试冲突集成 | 非生产；目标与来源两个父提交顺序准确、提交和分支不同；解决差异属于已声明冲突且出现在候选文件中；远端观测不超过一小时；有证据并经人工批准。 |

自动审核材料缺失、格式异常、时间在未来、过期或分数不达标时，要求人工批准。同一候选存在人工退回时，所有路径都阻断，包括 Hotfix；退回记录过期或策略更新也不解除阻断。解决问题后创建修订候选，非代码反馈也应如实更新任务修订，不得删除退回记录。自动审核不能替代冲突集成审核或生产审核。Hotfix 进入生产前必须转为普通交付候选，重新收集检查和批准，仍满足既有验收与发布条件。

自动审核阈值是项目策略，不是通用安全概率。示例提供保守阈值且默认关闭自动审核。分数不能绕过确定性条件。校验器自身不扫描敏感代码，也不判断一个 Bug 是否真的只恢复原行为。

## 接入方职责与可信边界

可信的外部适配器需要认证作者和审核人、读取受保护策略、从明确基线采集完整 Git 差异、核对任务归属与范围、读取真实文档修订、执行检查、扫描敏感变更并保留证据。不能信任作者自行填写的身份、文件列表、行数、敏感发现、分数或环境标签；策略、配置和记录的写权限需要独立保护。

冲突集成适配器必须重新获取目标与来源远端引用，验证真实双亲图，重建 Git 自动合并树，并以此计算解决差异。未解决冲突、额外提交、非预期父提交和真实冲突范围外改动都应拒绝。核心只检查这些观测记录是否一致，**不会**重建合并或证明远端分支存在。候选 `branch` 保留策略绑定的开发分支，测试目标记录在 `integration.targetBranch`；平台临时冲突分支由适配器管理。

核心只确认文件存在，不认证签名、不审阅证据正文、不证明模型执行、不读取当前工作区，也不能证明记录时间对应真实远端读取。替换证据文件内容不会被候选摘要检测到。用于实际放行时，适配器必须核验证据完整性，在动作前重新比对真实代码树和远端引用，并独立执行授权检查。使用真实时钟重新校验，API 的时间注入只用于确定性测试。开源核心没有附带模型厂商、密钥管理、企业角色、消息或部署连接器。

## 交接与重复操作

先读已有交接记录，再决定是否新增。交接材料应保留任务与文档修订、分支、准确提交、覆盖文件、未完成缺口及远端核验证据。提交覆盖当前范围且本次远端检查证明可获取时，允许复用，不要求等于远端最新提交。材料相同复用快照，材料变化追加快照并保留历史。初建需求尚无代码时，不制造空提交。

核对任务相关的暂存、未暂存与未跟踪改动，保留无关工作。实施、提交、推送和部署分别授权；同一动作与范围可复用已有授权。门禁拒绝应报告真实审核问题，不能误报为用户未授权。文档修订必须来自真实提供方，离线核心不内置平台专属查询。这里提供的是交接操作规范，不是新的身份认证或交接服务。

## TypeScript API

```ts
import { reviewDigest, validateReview } from "deliveryguard";
import type { ReviewPolicy, ReviewRecord } from "deliveryguard";

declare const policy: ReviewPolicy;
declare const record: ReviewRecord;
const candidateDigest = reviewDigest(record.candidate);
const policyDigest = reviewDigest(policy);
const result = validateReview(process.cwd(), policy, record);
// result.ok 只说明证据一致，不代表允许推送或部署。
```
