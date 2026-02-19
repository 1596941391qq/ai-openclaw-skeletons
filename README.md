# ai-openclaw-skeletons

面向 **Always On** 的 OpenClaw 生产级骨架集合仓库。

这个仓库不是业务代码仓库，而是“能力基础设施仓库”：
把可长期复用的能力做成可安装、可验证、可组合、可回滚的标准化单元。

## What

### 1. 这个仓库解决什么问题

在 24 小时运行的 Agent 体系里，如果没有统一骨架，常见问题是：

- 各能力各写一套，无法协同复用
- 配置靠手改，安装/升级冲突频发
- Skill 调 Skill 缺乏确定性边界，结果不可复现
- 规模上来后，权限、审计、生命周期不可治理

本仓库提供的是通用工程底座：

- Pack 化交付（最小能力单元）
- OpenClaw 配置合并与治理边界
- 安装、验证、发布、回滚的最小生产闭环

### 2. 核心对象

- `Pack`：最小能力交付单元，可单独安装
- `Release`：可部署快照，支持一键安装和回滚
- `Contract`：跨 Skill/MCP/CLI/Hook/Cron 的共享契约

### 3. 当前目录结构

```text
ai-openclaw-skeletons/
  Packs/
    audit-core-pack/
    audit-dashboard-pack/
    context-preloader-pack/
    hook-executor-pack/
    schedule-pack/
    skill-router-pack/
    token-usage-reporter-pack/
  Releases/
  contracts/
    schemas/
  scripts/
  templates/
```

## Why

### 1. 我们不赌单一生态，赌 Always On

我们不把未来绑死在某个单点生态上，而是坚持长期存在的工程范式：

- Skill
- MCP
- CLI
- Hook
- Cron

只要系统遵循这五类范式，骨架就能持续兼容。
今天可以是 OpenClaw，未来也可以迁移到更安全的 Rust 运行时（例如 ZeroClaw）。

### 2. 为什么强调“增量合并”

Pack 如果覆盖整个运行时目录，会导致：

- 其他能力被破坏
- 本地自定义被抹掉
- 多团队并行迭代无法共存

所以本仓库强制：

- Pack 只做增量 merge，且必须幂等
- Release 才允许覆盖，并且必须先备份再支持回滚

### 3. 为什么要契约优先

要让系统可协作、可审计、可替换，必须先有契约。
本仓库把“契约”落到五层：

- CLI-first
- MCP tool schema
- Skill 结构约束
- VERIFY 机制
- settings/hook 治理

## How

### 1. OpenClaw 运行时与配置入口

运行时目标目录：

- Windows：`%USERPROFILE%\.openclaw`
- macOS/Linux：`~/.openclaw`

唯一配置入口：

- `~/.openclaw/openclaw.json`

模板基线：

- `templates/.openclaw/openclaw.json`

### 2. Pack 合并边界（硬约束）

Pack 只能新增/合并：

- `skills/SkillName`
- `hooks/HookName`
- `tools.allow`
- `mcpServers`
- `contextFiles`

Pack 禁止：

- 删除已有配置
- 重置整份 `openclaw.json`
- 覆盖未声明字段

### 3. Hook 生命周期（V1 固定）

- `SessionStart`
- `PreToolUse`
- `PostToolUse`
- `SessionEnd`

### 4. MCP Server 最小结构

`mcpServers.<name>` 约束：

- `command` 必填
- `args` 必填（可空数组）
- `env` 必填（可空对象）
- `transport` 必填：`stdio | http | sse`

### 5. 安装、验证、回滚

Pack 安装（增量、幂等）：

```bash
node scripts/pack-install.mjs <pack-name>
```

基础验证：

```bash
node scripts/pack-lint.mjs
node scripts/verify-pack.mjs
node scripts/release-install.mjs --dry-run
```

Release 回滚：

```bash
pnpm openclaw-release -- rollback
```

## 场景提示（拿这套骨架去玩）

这套骨架不仅适合营销自动化，也适合快速搭建：

- AI 视频剪辑流水线
- AI 音乐创作工作流
- AI 3D 内容生成管线

你可以“玩花的”，但底层仍建议遵守 Skill/MCP/CLI/Hook/Cron 的统一范式。

## 正常案例（通用）

- 内容团队：`schedule-pack + hook-executor-pack` 做定时生成与门禁
- 运营团队：`skill-router-pack + context-preloader-pack` 做多角色协同
- 工程团队：`audit-core-pack + token-usage-reporter-pack` 做审计与成本追踪

## 工程规范

### 1. 技术栈

- Node.js 20 LTS
- pnpm 8+
- TypeScript 5.x
- tsx
- Vitest
- zod
- eslint + prettier
- GitHub Actions

### 2. 提交规范

建议采用 Conventional Commits：

- `feat:` 新能力
- `fix:` 缺陷修复
- `refactor:` 重构
- `docs:` 文档变更
- `test:` 测试变更
- `build:` 构建/依赖/CI
- `chore:` 杂项维护

建议格式：

```text
<type>(<scope>): <summary>
```

### 3. PR 自查

- 是否保持 Pack 增量安装原则
- 是否更新对应 `INSTALL.md` / `VERIFY.md`
- 是否补充必要 schema/契约
- 是否可回滚
- 是否无破坏性配置变更

## 仓库边界

公开仓只维护通用骨架与通用范式，不包含：

- 私有业务 Bundle
- 客户特定策略
- 组织内部机密流程

私有实现建议放在私有开发仓，并通过 contracts 与 Pack 接口对接本仓。
