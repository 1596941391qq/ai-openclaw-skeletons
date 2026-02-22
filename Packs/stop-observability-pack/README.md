# stop-observability-pack

将 [echoVic/stop-protocol](https://github.com/echoVic/stop-protocol) 的核心思想落地到 OpenClaw Skeleton：

- Manifest: 用 `stop/agent-team.skill.json` 描述技能输入输出、副作用、断言。
- Trace: 在 `after_tool_call` 采集结构化 span，写入 `.openclaw/logs/stop-spans.jsonl`。
- Assertions: 对工具执行结果做可验证检查，写入 `.openclaw/logs/stop-assertions.jsonl`。
- Session Report: 在 `session_end` 汇总成 `.openclaw/reports/stop-latest-report.json`，并落盘 trace 到 `.openclaw/.sop/traces/`。

这个 Pack 同时支持“agent team”风格字段（`role`、`delegated_to`），方便追踪 planner / executor / reviewer 的协作链路。

## 文件结构

```text
Packs/stop-observability-pack/
├─ pack.openclaw.json
├─ README.md
├─ INSTALL.md
├─ VERIFY.md
└─ src/.openclaw/
   ├─ hooks/stop-observability/
   │  ├─ postToolUse.mjs
   │  └─ sessionEnd.mjs
   └─ stop/agent-team.skill.json
```

## 输出示例

- `.openclaw/logs/stop-spans.jsonl`
- `.openclaw/logs/stop-assertions.jsonl`
- `.openclaw/.sop/traces/20260222T000000Z_<session>.jsonl`
- `.openclaw/reports/stop-latest-report.json`
