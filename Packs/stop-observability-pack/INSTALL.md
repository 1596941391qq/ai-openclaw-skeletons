# INSTALL

## 1. 安装 Pack

```bash
node scripts/pack-install.mjs stop-observability-pack
```

## 2. 检查配置合并结果

确认 `~/.openclaw/openclaw.json` 中存在：

- `hooks.internal.load.extraDirs` 包含 `./hooks`
- `hooks.internal.handlers` 包含：
  - `./hooks/stop-observability/postToolUse.mjs`
  - `./hooks/stop-observability/sessionEnd.mjs`

## 3. 可选：定制 agent team manifest

编辑：

`~/.openclaw/stop/agent-team.skill.json`

可定义输入输出、断言和协作角色约束。

## 4. 可选：预算门禁阈值

在 `~/.openclaw/stop/agent-team.skill.json` 的 `governance.budget` 下调整：

- `max_tool_calls`
- `max_errors`
- `max_total_duration_ms`
- `max_total_tokens`
- `max_total_cost_usd`
