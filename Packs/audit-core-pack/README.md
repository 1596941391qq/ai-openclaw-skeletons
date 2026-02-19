# Audit Core Pack

## 用途

工具治理、权限控制、生命周期自动化的基础设施。

## 核心组件

### 1. SessionStart Hook
- 初始化审计会话
- 设置会话元数据
- 创建审计日志文件

### 2. PreToolUse Hook
- 权限检查 (allow/deny 列表)
- 速率限制
- 审计日志记录（调用前）
- 敏感数据脱敏

### 3. PostToolUse Hook
- 记录调用结果
- 记录执行耗时
- 错误追踪

### 4. SessionEnd Hook
- 生成会话摘要
- 统计调用数据
- 导出审计报告

## 配置示例

```json
{
  "tools": {
    "allow": [],
    "deny": ["exec", "system_exec"]
  },
  "hooks": {
    "SessionStart": ["./audit-core-pack/hooks/sessionStart.mjs"],
    "PreToolUse": ["./audit-core-pack/hooks/preToolUse.mjs"],
    "PostToolUse": ["./audit-core-pack/hooks/postToolUse.mjs"],
    "SessionEnd": ["./audit-core-pack/hooks/sessionEnd.mjs"]
  },
  "skills": {
    "audit-trail": {
      "source": "github.com/1596941391qq/ai-openclaw-skeletons-dev",
      "enabled": true
    }
  }
}
```

## 审计日志位置

```
~/.openclaw/audit/
├── {session-id}.json      # 会话详细日志
└── reports/
    └── {session-id}-report.json  # 会话摘要报告
```

## 配套工具

- **audit-trail**: CLI 查看审计日志
- **audit-dashboard**: Web UI 可视化

## 实现说明

实际代码位于:
`github.com/1596941391qq/ai-openclaw-skeletons-dev/Packs/audit-core-pack/`
