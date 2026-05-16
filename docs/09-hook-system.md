# 09 — Hook 治理系统

> 📹 [视频教程待录] — 本篇对应视频录制后将在此更新链接

## 你将学到

- Hook 系统的设计目标
- `before:tool_call` 和 `after:tool_call` 钩子
- 自定义 Handler 编写
- 实战：实现文件写入审计钩子

## 前置条件

- 完成 [08-memory-bus.md](./08-memory-bus.md)
- 理解中间件/拦截器模式
- 了解 `.claude/settings.json` 结构

## 核心概念

Hook 系统是 OpenClaw 的治理层。它在 Agent 执行工具调用的前后插入自定义逻辑：

```
Agent 意图 → [before hook] → 工具执行 → [after hook] → 结果返回
```

用途：
- 审计日志（谁在什么时候做了什么）
- 安全拦截（阻止危险操作）
- 数据转换（修改输入/输出）
- 通知触发（操作完成后通知）

> 📸 截图：[Hook 执行流程图]

## Hook 配置

在 `.claude/settings.json` 中定义：

```json
{
  "hooks": {
    "before:tool_call": [
      {
        "name": "audit-logger",
        "handler": ".claude/hooks/audit-logger.js",
        "match": {
          "tools": ["Write", "Edit", "Bash"]
        }
      },
      {
        "name": "secret-guard",
        "handler": ".claude/hooks/secret-guard.js",
        "match": {
          "tools": ["Write", "Edit"],
          "pathPattern": "**/.env*"
        }
      }
    ],
    "after:tool_call": [
      {
        "name": "notify-on-publish",
        "handler": ".claude/hooks/notify-publish.js",
        "match": {
          "tools": ["Bash"],
          "commandPattern": "*publish*"
        }
      }
    ]
  }
}
```

## 步骤

### 1. 创建 Hook 目录

```bash
mkdir -p .claude/hooks
```

### 2. 编写 before:tool_call Hook

审计日志 — 记录所有文件写入操作：

```javascript
// .claude/hooks/audit-logger.js

export default async function auditLogger(context) {
  const { tool, params, timestamp, agent } = context;

  const logEntry = {
    timestamp: new Date().toISOString(),
    agent: agent.id,
    tool: tool.name,
    target: params.file_path || params.command || 'unknown',
    action: 'attempted'
  };

  // 追加到审计日志
  const logFile = '.claude/hooks/audit.log';
  const line = JSON.stringify(logEntry) + '\n';
  await Bun.write(logFile, line, { append: true });

  // 返回 { allow: true } 继续执行，{ allow: false } 拦截
  return { allow: true };
}
```

### 3. 编写安全拦截 Hook

阻止向敏感文件写入：

```javascript
// .claude/hooks/secret-guard.js

const SENSITIVE_PATTERNS = [
  /\.env$/,
  /credentials/i,
  /\.pem$/,
  /secret/i,
  /token/i
];

export default async function secretGuard(context) {
  const { params } = context;
  const targetPath = params.file_path || '';

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(targetPath)) {
      console.error(`[SecretGuard] BLOCKED: 尝试写入敏感文件 ${targetPath}`);
      return {
        allow: false,
        reason: `安全策略禁止直接写入匹配 ${pattern} 的文件`
      };
    }
  }

  return { allow: true };
}
```

### 4. 编写 after:tool_call Hook

发布完成后发送通知：

```javascript
// .claude/hooks/notify-publish.js

export default async function notifyPublish(context) {
  const { tool, params, result } = context;

  // 只在发布命令成功时触发
  if (result.exitCode !== 0) return;

  const notification = {
    type: 'publish-complete',
    command: params.command,
    timestamp: new Date().toISOString(),
    output: result.stdout?.slice(0, 200)
  };

  // 写入 Memory Bus 事件
  const filename = `${notification.timestamp.replace(/[:.]/g, '-')}_publish-complete_hook.json`;
  await Bun.write(
    `data/memory-bus/events/${filename}`,
    JSON.stringify(notification, null, 2)
  );
}
```

### 5. 条件匹配规则

Hook 的 `match` 字段支持多种匹配方式：

```json
{
  "match": {
    "tools": ["Write", "Edit"],
    "pathPattern": "workspace/**",
    "commandPattern": "git push*",
    "excludePattern": "*.test.*"
  }
}
```

| 字段 | 说明 | 示例 |
|------|------|------|
| `tools` | 匹配工具名 | `["Write", "Bash"]` |
| `pathPattern` | 匹配文件路径 | `"**/.env*"` |
| `commandPattern` | 匹配 Bash 命令 | `"*rm -rf*"` |
| `excludePattern` | 排除匹配 | `"*.test.*"` |

### 6. Hook 执行顺序

多个 Hook 按配置顺序执行。任何一个 `before` Hook 返回 `{ allow: false }` 都会中断执行链。

```
before:hook-1 (allow) → before:hook-2 (allow) → 工具执行 → after:hook-1 → after:hook-2
before:hook-1 (allow) → before:hook-2 (deny)  → 中断，不执行工具
```

> 📸 截图：[Hook 拦截时的终端输出]

## 验证

- [ ] Hook 文件语法正确（`bun check .claude/hooks/*.js`）
- [ ] before hook 能正确拦截匹配的操作
- [ ] after hook 在工具执行后触发
- [ ] 审计日志正确记录操作
- [ ] 不匹配的操作不触发 Hook

## 常见问题

**Q: Hook 报错会影响 Agent 执行吗？**
A: before hook 报错默认拦截操作（安全优先）。after hook 报错不影响已完成的操作。

**Q: Hook 可以修改工具参数吗？**
A: before hook 可以返回 `{ allow: true, params: modifiedParams }` 修改参数。

**Q: 如何调试 Hook？**
A: 在 Hook 中使用 `console.error` 输出调试信息，查看 `.claude/hooks/audit.log`。

**Q: Hook 性能影响大吗？**
A: 保持 Hook 逻辑简单（< 100ms）。避免在 Hook 中做网络请求。

## 下一步

治理机制就位，接下来学习定时任务自动调度 → [10-scheduled-tasks.md](./10-scheduled-tasks.md)
