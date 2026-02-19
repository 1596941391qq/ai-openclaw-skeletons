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

### 为什么需要骨架？

**没有骨架的 AI Agent：**
```
用户: "帮我发个邮件"
Agent: 直接发
→ 不知道发给谁
→ 不知道说什么
→ 发了也不知道发没发成功
→ 更不能审计和回滚
```

**有骨架的 AI Agent：**
```
用户: "帮我发个邮件"
Agent: 
  1. 检查权限（PreToolUse Hook）
  2. 加载上下文（Context Preloader）
  3. 路由到正确 skill（Skill Router）
  4. 执行并记录（Audit Trail）
  5. 返回结果（标准化输出）
→ 可控、可审计、可回滚、可替换
```

---

## 架构设计

### 三层模型

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Release (部署层)                                │
│  完整数字员工镜像，一键部署，支持回滚                        │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ 组合
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Bundle (岗位层)                                 │
│  多个 Pack 的组合，形成完整岗位能力                        │
│  例：客服专员 = 意图识别 + 知识库检索 + 工单创建 + 满意度收集  │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ 组装
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Pack (能力层)                                   │
│  最小能力单元，可独立安装、验证、替换                       │
│  例：权限检查、审计日志、意图路由、上下文预热              │
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

### 🔍 audit-core-pack - 审计与治理

**解决什么问题：**
数字员工做了啥？有没有越权？出问题怎么追溯？

**核心能力：**
- 4 个生命周期 Hook（SessionStart/PreToolUse/PostToolUse/SessionEnd）
- 工具权限检查（allow/deny 列表强制拦截）
- 敏感数据自动脱敏
- 完整审计日志

**使用场景：**
- 金融合规：记录每个操作，满足监管要求
- 企业安全：防止越权访问敏感数据
- 质量追溯：出问题可回放完整操作链

```json
{
  "tools": { "deny": ["exec", "system_command"] },
  "hooks": {
    "PreToolUse": ["./audit-core-pack/hooks/preToolUse.mjs"]
  }
}
```

### 🎯 skill-router-pack - 意图路由

**解决什么问题：**
用户说"帮我处理一下"，数字员工不知道用哪个技能。

**核心能力：**
- 自然语言意图识别
- 置信度评分系统
- Top-N 推荐 + 备选方案

**使用场景：**
- 多技能数字员工：自动路由到正确技能
- 降低用户学习成本：无需记住技能名称
- 新技能自动发现：配置即生效

```bash
$ skill-router "帮我分析下数据"
→ 推荐: data-analysis (92% 置信度)
→ 备选: chart-generation, report-export
```

### ⚡ hook-executor-pack - 执行引擎

**解决什么问题：**
配置了 hooks，但 OpenClaw Runtime 不执行，成了摆设。

**核心能力：**
- 统一 hook 执行入口
- 支持阻断式拦截（PreToolUse 可阻止操作）
- 执行结果收集与反馈

**使用场景：**
- 权限硬拦截：未授权操作直接拒绝
- 审计全覆盖：所有操作留痕
- 动态策略：运行时调整行为

### 🧠 context-preloader-pack - 上下文预热

**解决什么问题：**
每次对话都要重复交代背景信息，效率低下。

**核心能力：**
- SessionStart 自动加载上下文
- 多文件合并与压缩
- 后续技能自动继承

**使用场景：**
- 客户画像：自动加载客户历史记录
- 项目背景：自动加载项目文档
- 个人偏好：自动加载用户设置

### 🔄 pseo-pipeline-pack - 工作流引擎（示例）

**解决什么问题：**
复杂任务需要多步骤协作，如何标准化流程？

**核心能力：**
- 5 步标准化工作流
- 输入输出契约定义
- 进度追踪与报告

**使用场景：**
- 内容生产：关键词→大纲→写作→发布→追踪
- 数据分析：采集→清洗→分析→可视化→交付
- 客户服务：接待→诊断→解决→回访→归档

> 注：这是工作流引擎的示例实现，实际业务可参照此模式开发自己的 pipeline。

### 📊 audit-dashboard-pack - 可视化监控

**解决什么问题：**
数字员工干得好不好？怎么直观看到？

**核心能力：**
- Web UI 实时监控
- 会话列表与详情
- 异常事件告警
- 性能统计

**使用场景：**
- 运维监控：实时查看数字员工状态
- 质量审计：快速定位问题会话
- 管理报表：工作量与效率统计

---

## 快速开始

### 1. 安装核心骨架

```bash
git clone https://github.com/1596941391qq/ai-openclaw-skeletons.git
cd ai-openclaw-skeletons

# 安装基础设施 packs
node scripts/pack-install.mjs audit-core-pack
node scripts/pack-install.mjs skill-router-pack
node scripts/pack-install.mjs hook-executor-pack
node scripts/pack-install.mjs context-preloader-pack
```

### 2. 创建你的第一个 Pack

```bash
mkdir Packs/my-first-pack
cat > Packs/my-first-pack/pack.openclaw.json << 'EOF'
{
  "skills": {
    "my-skill": {
      "source": "your-repo/my-skill",
      "enabled": true
    }
  },
  "hooks": {
    "SessionStart": []
  }
}
EOF
```

### 3. 打包成 Bundle（可选）

```bash
# 创建客服专员岗位
cat > Bundles/CustomerService/bundle.json << 'EOF'
{
  "name": "CustomerService",
  "description": "24小时客服专员数字员工",
  "packs": [
    "audit-core-pack",
    "skill-router-pack",
    "intent-recognition-pack",
    "knowledge-base-pack",
    "ticket-system-pack"
  ]
}
EOF
```

### 4. 发布 Release

```bash
# 创建可部署镜像
node scripts/release-install.mjs --name "customer-service-v1.0"

# 回滚（如有问题）
node scripts/release-install.mjs --rollback
```

---

## 开发规范

### Pack 开发清单

- [ ] `pack.openclaw.json` - 配置声明
- [ ] `README.md` - 说明文档
- [ ] `VERIFY.md` - 验证步骤
- [ ] 增量合并原则 - 不覆盖其他配置
- [ ] 幂等性 - 重复安装无副作用

### Hook 开发规范

```javascript
// PreToolUse Hook 示例
export default async function preToolUse(ctx) {
  // 1. 权限检查
  if (!isAllowed(ctx.tool)) {
    throw new PermissionDenied(`Tool ${ctx.tool} not allowed`);
  }
  
  // 2. 审计记录
  await audit.log({...ctx, timestamp: Date.now()});
  
  // 3. 返回（阻断时 throw，放行时 return）
  return { allowed: true };
}
```

### 命名约定

- Pack: `{功能}-pack`（如 `audit-core-pack`）
- Skill: `{动词}-{名词}`（如 `route-skill`）
- Hook: `{时机}-{动作}`（如 `pre-check-permission`）
- Bundle: `{岗位名称}`（如 `CustomerService`）

---

## 生产部署

### 最小部署

```yaml
# docker-compose.yml
version: '3'
services:
  openclaw:
    image: openclaw/runtime:latest
    volumes:
      - ./.openclaw:/root/.openclaw
    environment:
      - OPENCLAW_CONFIG=/root/.openclaw/openclaw.json
```

### 高可用部署

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: digital-worker
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: openclaw
        image: openclaw/runtime:latest
        volumeMounts:
        - name: skeletons
          mountPath: /root/.openclaw
      volumes:
      - name: skeletons
        configMap:
          name: openclaw-skeletons-release
```

---

## 生态定位

```
┌────────────────────────────────────────────────────────┐
│  应用层：具体数字员工（客服、销售、分析师、程序员）         │
│  由各公司/团队基于骨架开发                                  │
├────────────────────────────────────────────────────────┤
│  骨架层：本仓库（OpenClaw Skeletons）                      │
│  提供基础设施、开发规范、最佳实践                          │
├────────────────────────────────────────────────────────┤
│  运行时：OpenClaw Runtime                                  │
│  执行数字员工的底层引擎                                    │
├────────────────────────────────────────────────────────┤
│  基础设施：模型、计算、存储、网络                          │
│  GPU/LLM API/向量数据库/对象存储                           │
└────────────────────────────────────────────────────────┘
```

**本仓库的定位：**
- 不是业务代码（那是应用层的事）
- 不是运行时（那是 OpenClaw 的事）
- 是**数字员工的基础设施和开发规范**

---

## 当前状态

### 基础设施 Packs（9个）

#### 核心治理层
| Pack | 状态 | 说明 |
|------|------|------|
| audit-core-pack | ✅ | 审计、权限、工具治理 |
| skill-router-pack | ✅ | 智能意图路由 |
| hook-executor-pack | ✅ | Hook 执行引擎 |
| context-preloader-pack | ✅ | 上下文预热 |
| audit-dashboard-pack | ✅ | 可视化监控 |

#### 工作流与发布层
| Pack | 状态 | 说明 |
|------|------|------|
| pseo-pipeline-pack | ✅ | PSEO 工作流引擎 |
| content-generator-pack | ✅ | 内容生成器 |
| gh-pages-publisher-pack | ✅ | GitHub Pages + UniFuncs 发布 |
| schedule-pack | ✅ | 定时任务调度 |

### Bundles（1个）

| Bundle | 版本 | 包含 Packs | 说明 |
|--------|------|-----------|------|
| PSEO | v1.1.0 | 5 packs | 完整链路：关键词→内容→发布→索引 |

### 架构层次

- **Layer 1**: Product Marketing Context (产品营销上下文)
- **Layer 2**: Campaign Ops Context (营销活动上下文)

### 总计

- **9 个基础设施 Packs**
- **1 个业务 Bundle (PSEO)**
- **7 步完整工作流** (关键词→内容→发布→索引)

### 待开发（欢迎贡献）

- [ ] memory-pack - 长期记忆管理
- [ ] multi-agent-pack - 多智能体协作
- [ ] notification-pack - 通知推送中心

---

## 贡献指南

### 提交新 Pack

1. Fork 本仓库
2. 在 `Packs/` 下创建 `{name}-pack/`
3. 实现 `pack.openclaw.json` 和 `README.md`
4. 通过验证脚本
5. 提交 PR

### 代码规范

```
feat(pack): 新增 XXX 能力
fix(hook): 修复权限检查 bug  
docs(readme): 更新部署说明
refactor(executor): 优化执行性能
```

---

## 许可证

MIT - 可自由用于商业和非商业场景。

但请记住：**能力越大，责任越大。**

数字员工不是玩具，部署到生产环境前请充分测试和审计。

---

## 相关资源

- **参考实现：** [ai-openclaw-skeletons-dev](https://github.com/1596941391qq/ai-openclaw-skeletons-dev)（私有，含完整 skill 代码）
- **OpenClaw 官方：** https://openclaw.ai
- **讨论区：** GitHub Discussions

---

**准备好雇佣你的第一个数字员工了吗？** 🚀

---

## Talos-Style Structured State (Added)

This skeleton now includes:

- Dual-layer context files and schemas:
  - Layer 1: `product-marketing-context.(md|json)`
  - Layer 2: `campaign-ops-context.(md|json)`
- Structured schedule contract:
  - `contracts/schemas/schedule-job.schema.json`
  - `schedules` field in `openclaw.json`
- Decision/audit contract:
  - `contracts/schemas/decision-log.schema.json`
- New infrastructure pack:
  - `Packs/schedule-pack`

Design principle:

- Markdown for human readability.
- JSON for deterministic machine validation and automation.

---

## Automatic Token Usage Reporting (Added)

Install:

```bash
node scripts/pack-install.mjs token-usage-reporter-pack
```

What happens automatically:

- `PostToolUse` hook appends token usage events to:
  - `.openclaw/logs/token-usage.jsonl`
- `SessionEnd` hook writes aggregated report to:
  - `.openclaw/reports/token-usage-latest.json`

Behavior:

- Uses provider token fields when available.
- Falls back to deterministic estimation when missing.

This follows the Talos-style lifecycle accounting approach: collect at execution boundary, report at lifecycle boundary.

