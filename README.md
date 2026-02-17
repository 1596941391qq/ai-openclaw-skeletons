# ai-openclaw-skeletons

面向 OpenClaw 的生产级骨架集合仓库。

这个仓库不是业务代码仓库，而是“能力基础设施仓库”：
把营销部门需要的核心能力做成可安装、可验证、可组合、可回滚的标准化单元。

## What

### 1. 仓库解决的是什么问题

在 24 小时运行的 OpenClaw 营销体系中，如果没有统一骨架，常见问题是：

- SEO、社媒、广告各自实现一套流程，难以协同。
- 配置靠手改，安装冲突、升级冲突、回滚困难。
- Skill 调 Skill 缺少确定性边界，运行结果不可复现。
- 系统规模变大后，能力不可治理、不可审计。

本仓库的定位是：

- 提供 Pack/Bundle/Release 三层分发模型。
- 提供 OpenClaw 配置合并与治理边界。
- 提供安装、验证、回滚、CI 的最小生产闭环。

### 2. 核心对象

- `Pack`：最小能力交付单元，可单独安装。
- `Bundle`：多个 Pack 的逻辑组合（如 `MarketingDept`）。
- `Release`：全量快照，支持一键安装与回滚。
- `Contract`：跨模块共享契约（CLI/MCP/Skill/Hook/Verify）。

### 3. 当前目录结构

```text
ai-openclaw-skeletons/
  Packs/
    seo-core-pack/
    ads-core-pack/
    social-core-pack/
    analytics-core-pack/
  Bundles/
    MarketingDept/
      bundle.json
  Releases/
  contracts/
    schemas/
      openclaw.schema.json
  scripts/
    pack-install.mjs
    pack-lint.mjs
    verify-pack.mjs
    release-install.mjs
    release-rollback.mjs
    openclaw-release.mjs
  templates/
    .openclaw/
      openclaw.json
```

## Why

### 1. 为什么采用 Pack / Bundle / Release 三层

目标是同时满足两种能力：

- 单装：只安装某个能力（例如只上 `seo-core-pack`）。
- 全装：一键安装整套营销系统（例如 `MarketingDept`）。

三层分发能把“能力拆分”和“整套交付”解耦：

- Pack 负责能力边界与可复用。
- Bundle 负责业务场景编排。
- Release 负责运维效率与一致性。

### 2. 为什么强调“增量合并”而非“覆盖安装”

Pack 安装如果覆盖 `~/.openclaw`，会导致：

- 其他 Pack 被破坏。
- 用户本地自定义被覆盖。
- 多团队并行迭代无法共存。

因此本仓库强制规则：

- Pack：只做增量 merge，幂等执行。
- Release：允许覆盖，但必须先自动备份并支持回滚。

### 3. 为什么边界按“数据闭环”而不是按“流程阶段”

流程阶段（调研、产出、发布、复盘）天然会在各渠道重复，容易形成孤岛。

本仓库采用数据闭环思路：

- 渠道能力（SEO/Social/Ads）是执行层。
- 统一对象和契约是协作层。
- Hook 和 Verify 是治理层。

这样可以在不同渠道之间共享同一套语义和验收口径。

## How

### 1. OpenClaw 运行时与配置入口

运行时目标目录：

- Windows: `%USERPROFILE%/.openclaw`
- macOS/Linux: `~/.openclaw`

唯一配置入口文件：

- `~/.openclaw/openclaw.json`

基线模板：

- `templates/.openclaw/openclaw.json`

### 2. 配置契约（允许合并的字段）

Pack 只允许新增/合并以下字段：

- `tools.allow`
- `tools.deny`
- `mcpServers`
- `hooks`
- `skills`
- `contextFiles`

不允许：

- 删除他人配置
- 重置整份 `openclaw.json`
- 覆盖未声明字段

### 3. MCP Server 最小结构

`mcpServers.<name>` 固定字段：

- `command`（必填）
- `args`（必填，可空数组）
- `env`（必填，可空对象）
- `transport`（必填，枚举：`stdio` / `http` / `sse`）

### 4. Hook 触发点（第一版固定）

- `SessionStart`
- `PreToolUse`
- `PostToolUse`
- `SessionEnd`

### 5. 安装与发布模型

#### Pack 安装（增量、幂等）

```bash
node scripts/pack-install.mjs <pack-name>
```

示例：

```bash
node scripts/pack-install.mjs seo-core-pack
```

行为：

- 若 `openclaw.json` 不存在，先从模板初始化。
- 合并 Pack 的 `pack.openclaw.json` 到目标配置。
- 复制 `src/.openclaw/skills/*` 到 `~/.openclaw/skills/`。
- 去重处理数组字段，重复安装不产生副作用。

#### Release 安装（覆盖 + 自动备份）

```bash
node scripts/release-install.mjs
```

行为：

- 安装前自动备份 `~/.openclaw` 到 `.openclaw.backup-YYYYMMDD-HHMMSS`。
- 覆盖安装新 Release。
- 自动清理旧备份，仅保留最近 3 个。

#### 回滚

```bash
pnpm openclaw-release -- rollback
```

行为：

- 恢复最新备份为当前 `~/.openclaw`。

### 6. 验证闭环

基础验证脚本：

```bash
node scripts/pack-lint.mjs
node scripts/verify-pack.mjs
node scripts/release-install.mjs --dry-run
```

每个 Pack 在 `VERIFY.md` 至少要覆盖：

- 结构验证：目录、`SKILL.md`、安装产物存在。
- CLI 验证：`--help`、`--json`、exit code。
- MCP 验证：server 可启动、tool 可列出、结构化输出合法。
- 权限验证：所需 tool 在 allowlist，且不污染其他字段。
- 幂等验证：重复安装无额外 diff。

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
- Changesets（后续启用发布流）

### 2. 提交规范（Commit Convention）

推荐使用 Conventional Commits：

- `feat:` 新能力
- `fix:` 缺陷修复
- `refactor:` 重构（无行为变更）
- `docs:` 文档变更
- `test:` 测试变更
- `build:` 构建/依赖/CI
- `chore:` 杂项维护

建议格式：

```text
<type>(<scope>): <summary>
```

示例：

- `feat(seo-pack): add keyword clustering workflow`
- `fix(pack-install): ensure hooks array dedupe`
- `docs(readme): define release rollback contract`
- `build(ci): add release-dry-run gate`

### 3. 分支与合并建议

- 默认分支：`main`
- 推荐短分支开发：`feat/*`、`fix/*`、`docs/*`
- 合并前至少通过 CI：`typecheck/lint/test/build/pack-lint/release-dry-run`

### 4. PR 验收清单

每次 PR 建议自查：

- 是否保持 Pack 增量安装原则。
- 是否更新对应 `INSTALL.md` / `VERIFY.md`。
- 是否补充必要契约（schema 或示例）。
- 是否可回滚。
- 是否无破坏性配置改动。

## 新增一个 Pack 的标准流程

1. 在 `Packs/<name>/` 创建最小骨架：
   - `README.md`
   - `INSTALL.md`
   - `VERIFY.md`
   - `pack.openclaw.json`
   - `src/.openclaw/skills/<SkillName>/SKILL.md`
2. 在 `pack.openclaw.json` 仅声明该 Pack 的增量配置。
3. 如需组合交付，更新 `Bundles/<BundleName>/bundle.json`。
4. 补齐验证步骤并执行本地验证脚本。
5. 提交 PR，通过 CI 后合并。

## 仓库边界（与其他仓库的关系）

本仓库建议作为三仓架构中的“能力仓”：

- 本仓库：核心骨架（Packs/Bundles/Releases/contracts）
- 基础设施仓：K8s + OpenClaw 部署与运维
- 业务仓：业务模块（例如 mksaas / serverless）

核心原则：

- 能力与部署解耦
- 能力与业务解耦
- 通过契约协同，而不是通过隐式约定协同

## 当前状态

当前已初始化：

- `MarketingDept` bundle 占位
- `seo/ads/social/analytics` 四个 core pack 占位
- 配置基线与合并脚本
- release 备份与回滚机制
- 最小 CI 验证流程

后续建议优先级：

1. 先补 `seo-core-pack` 的真实 CLI + MCP + VERIFY 样例。
2. 再补 `analytics-core-pack`，先把测量闭环打通。
3. 最后把 `ads` 与 `social` 接入统一策略与事件回写。