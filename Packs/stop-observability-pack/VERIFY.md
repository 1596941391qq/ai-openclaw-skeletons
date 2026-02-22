# VERIFY

## 1. 触发一次带工具调用的会话

运行任意会触发 `after_tool_call` 的任务。

## 2. 检查日志文件

确认存在并有内容：

- `.openclaw/logs/stop-spans.jsonl`
- `.openclaw/logs/stop-mcp-spans.jsonl`（如果本次调用了 MCP 工具）
- `.openclaw/logs/stop-assertions.jsonl`
- `.openclaw/logs/stop-guard-events.jsonl`

## 3. 结束会话后检查汇总

确认存在：

- `.openclaw/.sop/traces/*.jsonl`
- `.openclaw/otel/traces/*.jsonl`
- `.openclaw/reports/stop-latest-report.json`
- `.openclaw/reports/stop-guard-latest.json`

## 4. 关键字段

`stop-latest-report.json` 需包含：

- `session_id`
- `spans`
- `by_tool`
- `by_role`
- `assertions`
