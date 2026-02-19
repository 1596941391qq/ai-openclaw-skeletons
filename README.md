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
    # 核心营销能力
    seo-core-pack/
    ads-core-pack/
    social-core-pack/
    analytics-core-pack/
    # 基础设施与优化
    audit-core-pack/          # 审计、权限、工具治理
    skill-router-pack/        # 智能技能路由
    hook-executor-pack/       # Hook 执行器
    context-preloader-pack/   # 上下文预热
    pseo-pipeline-pack/       # PSEO 全流程闭环
    audit-dashboard-pack/     # 审计可视化
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

## 基础设施 Packs 说明（新增）

除了核心营销能力，本仓库还包含以下基础设施 Packs，用于解决系统治理、开发效率和用户体验问题：

### audit-core-pack - 审计与权限治理

**解决的问题：**
- 工具调用无审计日志
- 权限控制只在配置层，无法强制拦截
- 无法追踪谁在什么时候用了什么工具

**核心能力：**
- 4 个生命周期 Hook（SessionStart/PreToolUse/PostToolUse/SessionEnd）
- 工具权限检查（allow/deny 列表）
- 敏感数据脱敏
- 审计日志持久化

**配套工具：**
- `audit-trail` - CLI 查看审计日志
- `audit-dashboard` - Web UI 可视化

### skill-router-pack - 智能技能路由

**解决的问题：**
- 26 个 skill 用户不知道用哪个
- 每次都要解释一遍 skill 的用途
- 用户用自然语言描述需求，无法自动匹配

**核心能力：**
- 关键词匹配 + 正则模式识别
- 置信度评分系统
- Top 3 推荐 + 备选

**使用效果：**
```
用户: "帮我写cold email开发客户"
→ 推荐: cold-email (100% 置信度)
```

### hook-executor-pack - Hook 执行器

**解决的问题：**
- hooks 只在 `openclaw.json` 配置，OpenClaw Runtime 不执行
- 工具治理无法落地

**核心能力：**
- 统一读取 hooks 配置并执行
- PreToolUse 可阻断工具调用
- 收集执行结果

**与 audit-core-pack 配合：**
```json
{
  "hooks": {
    "PreToolUse": ["./audit-core-pack/hooks/preToolUse.mjs"]
  }
}
```

### context-preloader-pack - 上下文预热

**解决的问题：**
- 每个 skill 都要重复读取 product-marketing-context
- 用户重复回答相同问题

**核心能力：**
- SessionStart 自动加载上下文文件
- 生成压缩后的 context prompt
- 后续 skills 自动获得上下文

**加载的文件：**
- `.openclaw/product-marketing-context.md`
- `.openclaw/content-strategy.md`
- `.openclaw/analytics-tracking-plan.md`

### pseo-pipeline-pack - PSEO 全流程闭环

**解决的问题：**
- content-strategy 和 programmatic-seo 割裂
- 从关键词到内容到排名追踪无自动化

**核心能力：**
5 步流程：关键词研究 → 模板设计 → 内容生成 → 发布计划 → 排名追踪

**输出示例：**
```bash
$ node pseo-pipeline.mjs "ecommerce-seo" "shopify seo,dtc marketing"

✓ 3 个关键词机会 (10,337 月搜索量)
✓ 内容模板结构 (6 sections, 2500字)
✓ 3 篇文章计划 (7500 字)
✓ 3 周发布时间表
✓ 排名追踪配置 (Google US/UK)
```

### audit-dashboard-pack - 审计可视化

**解决的问题：**
- CLI 查看审计日志不方便
- 无法实时监控系统状态

**核心能力：**
- 深色主题 Web UI
- 实时数据刷新
- 会话列表、拒绝事件、工具统计

**使用方法：**
```bash
node server.mjs
open http://localhost:3456
```

---

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

### 已完成的 Packs

**核心营销能力（4个）：**
- ✅ `seo-core-pack` - SEO 审计、PSEO、Schema、竞品分析
- ✅ `ads-core-pack` - 付费广告、发布策略、定价、推荐计划
- ✅ `social-core-pack` - 社媒内容、文案、邮件序列、冷邮件
- ✅ `analytics-core-pack` - 追踪、A/B测试、CRO优化

**基础设施与优化（6个）：**
- ✅ `audit-core-pack` - 审计、权限、工具治理
- ✅ `skill-router-pack` - 智能技能路由
- ✅ `hook-executor-pack` - Hook 执行器
- ✅ `context-preloader-pack` - 上下文预热
- ✅ `pseo-pipeline-pack` - PSEO 全流程闭环
- ✅ `audit-dashboard-pack` - 审计可视化

**Bundle：**
- ✅ `MarketingDept` - 完整营销部门能力组合

**基础设施：**
- ✅ 配置基线与合并脚本
- ✅ release 备份与回滚机制
- ✅ 最小 CI 验证流程

### 总计

- **36 个 Skills**（26 营销 + 6 基础设施 + 4 工具）
- **10 个 Packs**（4 核心 + 6 基础设施）
- **1 个 Bundle**

### 后续建议优先级

1. **生产验证** - 在真实 OpenClaw 环境中验证 Hook 执行器
2. **性能优化** - 大规模内容生成时的性能调优
3. **扩展能力** - 接入更多渠道（TikTok、Discord 等）