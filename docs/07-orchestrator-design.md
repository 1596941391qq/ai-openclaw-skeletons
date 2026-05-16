# 07 — Orchestrator 编排设计

> 📹 [视频教程待录] — 本篇对应视频录制后将在此更新链接

## 你将学到

- Orchestrator 与 Bundle 的区别
- 状态机设计模式
- Blueprint（蓝图）编写
- Memory Contract（记忆契约）的作用

## 前置条件

- 完成 [06-bundle-composition.md](./06-bundle-composition.md)
- 理解有限状态机概念
- 了解跨任务上下文传递的需求

## 核心概念

Orchestrator 是 Bundle 之上的编排层。区别：

| 维度 | Bundle | Orchestrator |
|------|--------|-------------|
| 执行模式 | 线性管道 | 状态机 |
| 状态管理 | 无状态 | 有状态 |
| 分支逻辑 | 简单条件 | 复杂决策树 |
| 跨会话 | 单次执行 | 可跨会话恢复 |
| 记忆 | 无 | Memory Contract |

```
Orchestrator
├── Blueprint (蓝图：定义状态和转换)
├── Memory Contract (记忆契约：跨任务数据)
└── Bundle[] (执行单元：每个状态触发的管道)
```

> 📸 截图：[Orchestrator 架构层次图]

## Blueprint 蓝图

蓝图定义了状态机的所有状态和转换规则：

```markdown
# Orchestrators/SEO/blueprint-v1.md

## 状态定义

### IDLE
- 入口状态
- 等待触发条件

### MINING
- 触发条件：收到新品牌种子词
- 执行：nichedigger Bundle
- 成功 → SCORING
- 失败 → ERROR_RECOVERY

### SCORING
- 触发条件：挖词完成
- 执行：关键词评分 Pack
- 通过 → PUBLISHING
- 不通过 → MINING（重新挖词）

### PUBLISHING
- 触发条件：有已审批关键词
- 执行：gh-pages-publisher Bundle
- 成功 → MONITORING
- 失败 → ERROR_RECOVERY

### MONITORING
- 触发条件：文章已发布
- 执行：数据监控 Pack
- 持续 → MONITORING
- 异常 → ALERT

### ERROR_RECOVERY
- 记录错误上下文
- 通知人工介入
- 恢复 → 上一个有效状态
```

### 状态转换图

```
IDLE → MINING → SCORING → PUBLISHING → MONITORING
  ↑       ↓         ↓          ↓            ↓
  └───────┴─────────┴──────────┴── ERROR_RECOVERY
```

## Memory Contract 记忆契约

记忆契约定义了跨任务传递的数据结构：

```json
{
  "contract": "seo-orchestrator-v1",
  "fields": {
    "currentState": {
      "type": "enum",
      "values": ["IDLE", "MINING", "SCORING", "PUBLISHING", "MONITORING"],
      "required": true
    },
    "brand": {
      "type": "string",
      "required": true
    },
    "lastCompletedStep": {
      "type": "string",
      "description": "最后成功完成的步骤 ID"
    },
    "pendingKeywords": {
      "type": "array",
      "items": "string",
      "description": "待处理的关键词列表"
    },
    "errorLog": {
      "type": "array",
      "items": {
        "timestamp": "string",
        "state": "string",
        "message": "string"
      }
    }
  },
  "persistence": {
    "location": "memory/{{channel}}/orchestrator-state.json",
    "writePolicy": "on-state-change",
    "readPolicy": "on-session-start"
  }
}
```

> 📸 截图：[记忆契约文件在项目中的位置]

## 步骤

### 1. 设计状态图

先在纸上画出你的业务流程：
- 有哪些阶段？
- 每个阶段的触发条件？
- 成功/失败分别去哪？

### 2. 编写 Blueprint

```bash
mkdir -p Orchestrators/my-flow
cat > Orchestrators/my-flow/blueprint-v1.md << 'BLUEPRINT'
# My Flow Blueprint v1

## 状态：INIT
- 入口
- 加载 Memory Contract
- → PROCESS

## 状态：PROCESS
- 执行 Bundle: my-pipeline
- 成功 → DONE
- 失败 → RETRY

## 状态：RETRY
- 最多重试 3 次
- 成功 → DONE
- 超限 → FAILED

## 状态：DONE
- 写入结果
- 清理临时文件
- → IDLE
BLUEPRINT
```

### 3. 定义 Memory Contract

```bash
cat > Orchestrators/my-flow/memory-contract.md << 'CONTRACT'
# Memory Contract: my-flow

## 持久化字段
- currentState: 当前状态
- retryCount: 重试次数
- lastResult: 最后执行结果

## 写入时机
- 每次状态转换时写入

## 读取时机
- 会话启动时读取，恢复到上次状态
CONTRACT
```

### 4. 实现状态转换逻辑

Orchestrator 的运行时由 Agent 驱动，Agent 读取 Blueprint 和 Memory Contract 后，按状态机逻辑执行。

## 验证

- [ ] Blueprint 覆盖所有业务状态
- [ ] 每个状态都有明确的转换条件
- [ ] Memory Contract 字段完整
- [ ] 错误恢复路径已定义
- [ ] Agent 能从中断处恢复执行

## 常见问题

**Q: Orchestrator 需要写代码吗？**
A: 不需要。Blueprint 是声明式的 Markdown，Agent 解释执行。

**Q: 状态太多怎么办？**
A: 拆成多个 Orchestrator，用 Memory Bus 通信（见下一篇）。

**Q: 如何测试状态转换？**
A: 手动设置 Memory Contract 中的 `currentState`，观察 Agent 行为。

**Q: 跨会话恢复可靠吗？**
A: 取决于 Memory Contract 的写入时机。建议每次状态变更都持久化。

## 下一步

Orchestrator 内部编排搞定了，跨 Orchestrator 通信需要 Memory Bus → [08-memory-bus.md](./08-memory-bus.md)
