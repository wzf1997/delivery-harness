# 可选 Jev 适配器

[English](jev.md)

`deliveryguard/jev` 和 `review jev` 命令接入 TypeSafe 的公开 Jev API。`check`、`review validate` 和主 API 保持离线。Jev 在这里提供基于任务摘要的审核信号，**不审阅实际源码**：不发送 diff，也不替代身份、真实代码、测试与远端核验。

## 使用步骤

准备普通 `delivery` 候选，在可信策略中设置 `autoReview.enabled: true`，并确保必需检查已经绑定当前候选且通过。Hotfix、冲突集成、生产环境、敏感发现、人工退回或范围不符都不会发起请求。现有虚构 Hotfix 示例默认不适用；不能只改模式而不重新绑定检查。

先预览完整请求，不联网、不写文件：

```sh
deliveryguard review jev .deliveryguard/reviews/current.json \
  --policy .deliveryguard/review-policy.json --json
```

通过运行环境或密钥管理器提供 `TYPESAFE_API_KEY`，不要写入候选、策略、命令参数或 shell 历史。适配器不会搜索密钥，也不会自动读取 `.env`。确认预览中的内容后显式发送：

```sh
mkdir -p .deliveryguard/reviews
deliveryguard review jev .deliveryguard/reviews/current.json \
  --policy .deliveryguard/review-policy.json \
  --model jev-latest --send --output .deliveryguard/reviews/jev-run-001 --json
```

输出目录必须是项目内的新目录，父目录需要存在。先保存 `evidence.json`，再保存 `review.json`，不覆盖原记录。成功后校验新记录，并把它登记到配置的当前审核记录清单：

```sh
deliveryguard review validate .deliveryguard/reviews/jev-run-001/review.json \
  --policy .deliveryguard/review-policy.json --json
deliveryguard check
```

登记属于显式项目修改，命令不会自动替换清单。失败请求的输出副本会移除当前候选的旧自动批准、保留人工记录，并保存不含原始错误正文的失败证据，退出码为 1；原输入不变。本地预检失败不请求、不写文件。命令或输出路径错误退出 2。预览退出 0 仅表示可以请求评估，不表示已批准；发送退出 0 要求批准记录保存并校验成功。

## 发送内容与分数映射

请求只包含模型、三个固定问题、任务摘要、验收条件、任务类型、文件数、改动行数、规则变更标志和敏感发现数量。JSON 中不附带作者、任务 ID、分支、提交摘要、文件名、源码、diff、证据正文或密钥；密钥只进入 HTTPS 鉴权头。**自由文本不会自动脱敏**，发送前必须从摘要和验收条件中移除机密与个人信息，并确认有权向提供方发送。

三个 Noul 问题分别判断：是否仅涉及 UI、验收条件是否明确、是否需要人工。前两项概率取最小值作为 `suitability`，第三项作为 `risk`，使用现有策略阈值判断。Noul 是“是”的概率，不是 Choice/Score 的 confidence，也不保证代码正确；取最小值只是保守组合规则，不是校准后的联合概率。

证据保留实际模型版本、三个概率、用量、问题版本、请求摘要、候选与策略摘要、阈值和时间。有效期沿用策略。人工退回和本地检查始终优先。模型别名可能变化，校准策略时可使用 `--model jev-1.13.0` 等固定版本，升级后重新评估阈值。

## 失败处理与边界

- 只连接官方 HTTPS 地址，不允许替换地址或跟随重定向。
- 单次请求，不自动重试；鉴权、限流、服务过载等错误返回人工处理，不能降级为批准。
- 默认超时 10 秒，API 最多允许 30 秒；请求不超过 16 KiB，响应不超过 64 KiB。
- 缺少或多出答案、类型错误、数值越界、用量异常、模型缺失或固定版本不一致均拒绝。
- 不保存原始服务错误、传输异常、密钥或服务端回显内容。
- 响应后重新检查候选、策略、检查和人工决定；CLI 发现输入文件变化时不写结果。输出路径拒绝越界及指向项目外的符号链接。

本地 JSON 可以被修改，不是签名凭证。适配器确实执行模型调用，但仅靠后续离线校验无法证明文件来源。真实身份、受保护策略、完整 Git 差异、敏感代码扫描、检查执行、证据完整性和外部动作授权仍由可信接入方负责。

## TypeScript API

```ts
import { runJevReview, saveJevReview } from "deliveryguard/jev";
import type { ReviewPolicy, ReviewRecord } from "deliveryguard";

declare const policy: ReviewPolicy;
declare const record: ReviewRecord;
const root = process.cwd();
const output = ".deliveryguard/reviews/jev-run-001";
const result = await runJevReview(root, policy, record, {
  ...(process.env.TYPESAFE_API_KEY ? { apiKey: process.env.TYPESAFE_API_KEY } : {}),
  evidencePath: `${output}/evidence.json`,
});
const path = saveJevReview(root, output, policy, record, result);
// 检查 result.status，human-required 不是批准。
```

调用前核对配置与输出路径；传输注入只用于可信测试和集成，不能由候选控制。包内不附带密钥。

## 合同来源与验证

实现依据 2026-09-21 核对的[官方 HTTP API](https://docs.typesafe.ai/api)、[Noul 定义](https://docs.typesafe.ai/primitives/noul)和[模型说明](https://docs.typesafe.ai/models)。自动测试使用虚构响应，不连接 TypeSafe。模拟测试通过不等于真实账号调用成功；真实验证需要配置密钥，并使用获准发送的非敏感候选。
