# Hook Executor Pack

## 用途

让 `~/.openclaw/openclaw.json` 中的 hooks 配置真正执行。解决"配置了但不运行"的问题。

## 工作原理

作为统一的 hook 执行入口：
1. 读取 `openclaw.json` 中的 hooks 配置
2. 按顺序执行注册的 hook 脚本
3. `PreToolUse` 可以阻断工具调用
4. 收集执行结果并返回

## 配置示例

```json
{
  "hooks": {
    "SessionStart": ["./audit-core-pack/hooks/sessionStart.mjs"],
    "PreToolUse": ["./audit-core-pack/hooks/preToolUse.mjs"],
    "PostToolUse": ["./audit-core-pack/hooks/postToolUse.mjs"],
    "SessionEnd": ["./audit-core-pack/hooks/sessionEnd.mjs"]
  }
}
```

## Hook 类型

| Hook | 执行时机 | 可阻断 | 用途 |
|------|---------|--------|------|
| SessionStart | 会话开始 | 否 | 初始化审计、加载上下文 |
| PreToolUse | 工具调用前 | ✅ | 权限检查、审计、限流 |
| PostToolUse | 工具调用后 | 否 | 结果记录、审计 |
| SessionEnd | 会话结束 | 否 | 摘要生成、报告导出 |

## 实现说明

实际代码位于:
`github.com/1596941391qq/ai-openclaw-skeletons-dev/Packs/hook-executor-pack/`

需要 OpenClaw Runtime 支持或 wrapper 脚本调用。
