# AI OpenClaw Skeletons（公开通用骨架）

面向 **Always On AI Agent 系统** 的生产级骨架仓库。  
这个仓库只放通用能力，不放私有业务实现。

## What

这是一个可组合、可验证、可升级的 OpenClaw 通用基础设施骨架，核心目标是：

- 快速搭建长期运行（24x7）的 Agent 系统
- 用统一契约把 Skill、MCP、CLI、Hook、Cron 串成一个稳定工程体系
- 支持单 Pack 增量安装，也支持 Release 一键全量安装

## Why

我们不赌单一生态，赌的是 **Always On** 这条长期范式：

- 今天是 OpenClaw，明天可以是更安全的 Rust Runtime（例如 ZeroClaw）
- 只要系统遵循 Skill / MCP / CLI / Hook / Cron 的工程范式，骨架就能持续兼容
- 重点不在某个框架名字，而在可持续演进的自动化能力层

## How（设计原则）

- `Pack` 是最小交付单元：可安装、可验证、可复用
- `Bundle` 是组合层：按场景把多个 Pack 组装
- `Release` 是预构建快照：支持一键安装、备份、回滚

配置治理规则：

- Pack 一律增量 merge，绝不覆盖整个运行时目录
- 默认运行时配置文件：`~/.openclaw/openclaw.json`
- 只允许新增/合并：`skills`、`hooks`、`tools.allow`、`mcpServers`、`contextFiles`
- 必须幂等：重复安装不产生副作用

## 仓库结构

```text
.
├─ Packs/                  # 通用能力包
├─ Bundles/                # 通用组合（不放私有业务编排）
├─ Releases/               # 发行快照（可一键安装）
├─ contracts/              # 共享 schema 与约束
├─ scripts/                # 安装、验证、发布、回滚脚本
└─ docs/                   # 设计说明与实践文档
```

## 当前通用 Pack（示例）

- `audit-core-pack`：审计事件采集与记录
- `skill-router-pack`：Skill 路由与分发
- `hook-executor-pack`：生命周期 Hook 执行框架
- `context-preloader-pack`：双层上下文预加载
- `audit-dashboard-pack`：审计视图与汇总
- `schedule-pack`：Cron/Schedule 任务支持
- `token-usage-reporter-pack`：Token 用量事件与会话报告

## 双层 Context（Talos 风格）

- Layer 1（稳定层）：长期不频繁变化的原则与战略上下文
- Layer 2（动态层）：当前阶段策略、实验、执行状态

当前提供 schema（示例）：

- `contracts/schemas/layer1-product-marketing-context.schema.json`
- `contracts/schemas/layer2-campaign-ops-context.schema.json`
- `contracts/schemas/schedule-job.schema.json`
- `contracts/schemas/decision-log.schema.json`
- `contracts/schemas/token-usage-event.schema.json`
- `contracts/schemas/token-usage-report.schema.json`

## 场景提示（欢迎“玩花的”）

这个骨架不只适合营销自动化，也适合快速搭建：

- AI 视频剪辑流水线（素材处理、分发、复盘）
- AI 音乐创作工作流（生成、评审、发布）
- AI 3D 内容生产管线（资产生成、版本管理、任务调度）

关键不是场景名字，而是把能力沉淀为可治理的 Pack 与契约。

## 正常案例（通用）

- 内容团队：用 `schedule-pack + hook-executor-pack` 做定时生成与质量门禁
- 运营团队：用 `skill-router-pack + context-preloader-pack` 做多角色协作
- 工程团队：用 `audit-core-pack + token-usage-reporter-pack` 做可观测与成本追踪

## 快速开始

```bash
git clone https://github.com/1596941391qq/ai-openclaw-skeletons.git
cd ai-openclaw-skeletons

node scripts/pack-install.mjs audit-core-pack
node scripts/pack-install.mjs skill-router-pack
node scripts/pack-install.mjs hook-executor-pack
node scripts/pack-install.mjs context-preloader-pack
node scripts/pack-install.mjs schedule-pack
node scripts/pack-install.mjs token-usage-reporter-pack
```

## 常用命令

```bash
node scripts/pack-lint.mjs
node scripts/verify-pack.mjs
node scripts/release-install.mjs --dry-run
pnpm openclaw-release -- rollback
```

## 边界说明

公开仓仅维护通用骨架与范式，不包含：

- 私有业务 Bundle
- 客户/组织特定策略
- 内部投放与增长机密流程

私有实现请放在私有开发仓，通过 contracts 与 Pack 接口对接本仓。
