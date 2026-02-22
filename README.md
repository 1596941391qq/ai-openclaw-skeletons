# OpenClaw Skeletons

面向 AI Agent 的**可插拔数字员工骨架系统**。

不是玩具，不是 demo，是**24小时运行的生产级数字员工基础设施**。

---

## 核心理念

### 什么是数字员工骨架？

想象你要雇佣一个员工：
- 需要明确职责边界（什么该做，什么不该做）
- 需要工作手册（遇到什么情况怎么处理）
- 需要审计监督（做了什么，做得怎么样）
- 需要可替换（做不好就换，不依赖特定个体）

**数字员工骨架就是这个基础设施：**
- Pack = 能力单元（员工的专业技能）
- Bundle = 岗位组合（完整岗位的能力集合）
- Hook = 监督机制（审计、权限、干预点）
- Contract = 协作契约（不同员工如何配合）

### 我们不赌单一生态，赌 Always On

我们不把未来绑定在某一个框架名字上，而是坚持长期有效的工程范式：

- Skill
- MCP
- CLI
- Hook
- Cron

这些范式会长期存在，骨架会持续兼容。  
今天可以是 OpenClaw，后续如果要用更安全的 Rust 运行时（例如 ZeroClaw）也可以，关键是看谁把 Always On 走得更远。

### 为什么需要骨架？

**没有骨架的 AI Agent：**
```text
用户: "帮我发个邮件"
Agent: 直接发
→ 不知道发给谁
→ 不知道说什么
→ 发了也不知道发没发成功
→ 更不能审计和回滚
```

**有骨架的 AI Agent：**
```text
用户: "帮我发个邮件"
Agent:
  1. 检查权限（runtime hook 拦截）
  2. 加载上下文（Context Preloader）
  3. 路由到正确 skill（Skill Router）
  4. 执行并记录（Audit Trail）
  5. 返回结果（标准化输出）
→ 可控、可审计、可回滚、可替换
```

---

## 架构设计

### 三层模型

```text
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Release (部署层)                              │
│  完整数字员工镜像，一键部署，支持回滚                    │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ 组合
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Bundle (岗位层)                               │
│  多个 Pack 的组合，形成完整岗位能力                      │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ 组装
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Pack (能力层)                                 │
│  最小能力单元，可独立安装、验证、替换                   │
└─────────────────────────────────────────────────────────┘
```

### 核心概念

| 概念 | 说明 | 类比 |
|------|------|------|
| **Pack** | 最小能力交付单元 | 员工的单项技能（如 Excel、PPT） |
| **Bundle** | 多个 Pack 的岗位组合 | 完整岗位（如产品经理、客服专员） |
| **Release** | 全量快照，可一键部署 | 员工入职档案（含所有能力和权限） |
| **Hook** | 生命周期干预点 | 监督机制（如审批、审计、质量检查） |
| **Contract** | 跨模块协作契约 | 部门间协作规范 |

---

## 示例 Packs（基础设施层）

这些 packs 不绑定任何业务场景，是**所有数字员工都需要的基础设施**。

- `audit-core-pack`：审计、权限、工具治理
- `skill-router-pack`：智能意图路由
- `hook-executor-pack`：Hook 执行引擎
- `context-preloader-pack`：上下文预热
- `audit-dashboard-pack`：可视化监控
- `schedule-pack`：定时任务调度
- `token-usage-reporter-pack`：Token 使用监控与会话报告

---

## 场景提示（玩花的）

如果你想玩更有创造性的方向，这套骨架也适合：

- AI 视频剪辑流水线（生成、剪辑、发布、复盘）
- AI 音乐创作流水线（创作、迭代、发布）
- AI 3D 内容生成流水线（资产生成、渲染、分发）

核心不是场景名，而是用统一的 Skill/MCP/CLI/Hook/Cron 范式把系统做成可治理、可复用、可演进。

---

## 快速开始

### 1. 安装核心骨架

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

### 2. 创建你的第一个 Pack

```bash
mkdir Packs/my-first-pack
```

---

## 开发规范

### Pack 开发清单

- [ ] `pack.openclaw.json` - 配置声明
- [ ] `README.md` - 说明文档
- [ ] `VERIFY.md` - 验证步骤
- [ ] 增量合并原则 - 不覆盖其他配置
- [ ] 幂等性 - 重复安装无副作用

### Hook 配置约定（与 OpenClaw Runtime 对齐）

统一使用 `hooks.internal` 结构：

- `hooks.internal.enabled`
- `hooks.internal.load.extraDirs`
- `hooks.internal.entries`
- `hooks.internal.handlers`（兼容模式）

### 命名约定

- Pack: `{功能}-pack`（如 `audit-core-pack`）
- Skill: `{动词}-{名词}`（如 `route-skill`）
- Hook: `{时机}-{动作}`（如 `pre-check-permission`）
- Bundle: `{岗位名称}`（如 `CustomerService`）

---

## 当前状态

### 通用基础设施 Packs（公开仓）

| Pack | 状态 | 说明 |
|------|------|------|
| audit-core-pack | ✅ | 审计、权限、工具治理 |
| skill-router-pack | ✅ | 智能意图路由 |
| hook-executor-pack | ✅ | Hook 执行引擎 |
| context-preloader-pack | ✅ | 上下文预热 |
| audit-dashboard-pack | ✅ | 可视化监控 |
| schedule-pack | ✅ | 定时任务调度 |
| token-usage-reporter-pack | ✅ | Token 使用监控与会话报告 |

### 结构化上下文层次（通用）

- **Layer 1**: Core Strategy Context（稳定策略层）
- **Layer 2**: Runtime Operations Context（动态执行层）

### 公开仓边界

- 仅提供通用骨架与通用模式
- 不包含私有业务 Bundle 和组织内部工作流
- 业务特化内容请在私有开发仓实现

---

## 贡献指南

1. Fork 本仓库
2. 在 `Packs/` 下创建 `{name}-pack/`
3. 实现 `pack.openclaw.json` 和 `README.md`
4. 通过验证脚本
5. 提交 PR

---

## 许可证

MIT - 可自由用于商业和非商业场景。

---

## 相关资源

- OpenClaw 官方：https://openclaw.ai
- GitHub Discussions


---

## 2026-02-22 增量更新（接入 STOP 协议能力）

本次新增 `stop-observability-pack`，将 `stop-protocol` 的核心能力组合进 Skeleton：

- `Manifest`：新增 `stop/agent-team.skill.json`，用于声明输入输出、副作用与断言规则。
- `Trace`：通过 `after_tool_call` Hook 记录结构化 span，输出到 `.openclaw/logs/stop-spans.jsonl`，并在会话结束写入 `.openclaw/.sop/traces/`。
- `Assertions`：按规则执行 post-check，结果输出到 `.openclaw/logs/stop-assertions.jsonl`。
- `Session Report`：在 `session_end` 汇总 `by_tool / by_role / by_status`，输出 `.openclaw/reports/stop-latest-report.json`。

此外，新增了 STOP 对应契约：

- `contracts/schemas/stop-skill-manifest.schema.json`
- `contracts/schemas/stop-trace-span.schema.json`
- `contracts/schemas/stop-assertion-report.schema.json`

这使项目具备了“类似 agent team”的可观测协作能力：可追踪 planner / executor / reviewer 的执行链路、工具调用和成功率。

## 方法论（伯克霍夫 + 奥卡姆）

> 目标：在可解释的前提下，用最少结构实现最大治理能力。

### 抽象映射

- `Skill` = SOP（流程） + Knowledge（规则） + Assertion（验收）
- `MCP` = Tool Interface（能力入口） + Runtime Code（执行层）

### 分层抽象

- `Pack`：原子能力（单一 SOP + tool + trace）
- `Bundle`：岗位聚合（多 Pack 编排成角色）
- `Release`：可部署快照（本地/云端一致，可回滚）
- `Hook`：治理干预点（权限、审批、审计、预算）
- `Contract`：跨模块协作契约（通信/目录/协议兼容）
- `Memory`：跨层记忆（长期策略 -> 短期目标 -> 执行复盘）

### 设计准则

- 伯克霍夫美学公式：用“秩序（可验证、可审计、可组合）”提升系统美感，限制无序扩展。
- 奥卡姆剃刀：默认最小实现，优先增量兼容，不引入非必要中间层。

### 当前落地

- STOP Manifest + Trace + Assertions
- OTel 对齐字段（便于接观测平台）
- MCP 专用追踪
- 预算门禁判定（`recommend_halt/continue`）

## 参考项目

以下项目作为本仓库演进的长期参考：

- STOP Protocol（可观测与可验证协议）  
  https://github.com/echoVic/stop-protocol  
  参考点：Manifest/Trace/Assertions 分层、渐进式可观测等级（L0-L3）、MCP 接入模式。

- Personal AI Infrastructure（个人 AI 基建实践）  
  https://github.com/danielmiessler/Personal_AI_Infrastructure  
  参考点：多组件组合式基础设施、长期可维护的自动化运行形态、面向生产的工程组织方式。
