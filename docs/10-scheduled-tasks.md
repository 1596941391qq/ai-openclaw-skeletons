# 10 — 定时任务与自动调度

> 📹 [视频教程待录] — 本篇对应视频录制后将在此更新链接

## 你将学到

- OpenClaw 定时任务的三种模式
- `scheduledDispatchSettings` 配置详解
- daily / interval / once 调度类型
- 实战：配置每日数据同步任务

## 前置条件

- 完成 [09-hook-system.md](./09-hook-system.md)
- 理解 cron 表达式基础
- 有需要定期执行的任务场景

## 核心概念

定时任务让 Agent 在无人值守时自动执行重复性工作：

- **daily** — 每天固定时间执行（如：每天 9:00 同步数据）
- **interval** — 按间隔循环执行（如：每 4 小时检查一次）
- **once** — 在指定时间执行一次（如：明天 14:00 发布文章）

```
┌─────────────────────────────────────────┐
│  Scheduler                              │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐  │
│  │  daily  │ │ interval │ │  once   │  │
│  └────┬────┘ └────┬─────┘ └────┬────┘  │
│       │            │            │       │
│       ▼            ▼            ▼       │
│  [Task Queue] ─── dispatch ──→ Agent   │
└─────────────────────────────────────────┘
```

> 📸 截图：[调度器运行时的状态面板]

## 配置结构

### scheduledDispatchSettings

```json
{
  "scheduledDispatchSettings": {
    "enabled": true,
    "timezone": "Asia/Shanghai",
    "tasks": [
      {
        "id": "daily-views-sync",
        "type": "daily",
        "time": "09:00",
        "command": "sync-unifuncs-views-to-feishu.ps1",
        "workDir": "Packs/gh-pages-publisher-pack/cil",
        "description": "每日同步 UniFuncs 浏览量到飞书",
        "enabled": true
      },
      {
        "id": "interval-serp-check",
        "type": "interval",
        "intervalMinutes": 240,
        "command": "check-serp-rankings.ps1",
        "workDir": "scripts",
        "description": "每 4 小时检查 SERP 排名变化",
        "enabled": true
      },
      {
        "id": "once-publish-batch",
        "type": "once",
        "datetime": "2026-05-18T14:00:00+08:00",
        "command": "publish-gh-pages-unifuncs.ps1 --batch pending",
        "workDir": "Packs/gh-pages-publisher-pack/cil",
        "description": "明天下午发布待发文章",
        "enabled": true
      }
    ],
    "logging": {
      "dir": ".claude/scheduled-tasks-logs",
      "retainDays": 7
    },
    "errorHandling": {
      "maxRetries": 2,
      "retryDelayMinutes": 5,
      "notifyOnFailure": true
    }
  }
}
```

## 步骤

### 1. 创建调度配置

```bash
mkdir -p .claude
```

在 `.claude/settings.json` 或独立的 `.claude/scheduled-tasks.json` 中配置：

```json
{
  "scheduledDispatchSettings": {
    "enabled": true,
    "timezone": "Asia/Shanghai",
    "tasks": []
  }
}
```

### 2. 添加 Daily 任务

每天固定时间执行：

```json
{
  "id": "daily-feishu-sync",
  "type": "daily",
  "time": "08:30",
  "command": "bash Packs/gh-pages-publisher-pack/cil/pseo-ghpages-feishu-sync.ps1",
  "description": "每日 8:30 同步发布状态到飞书",
  "enabled": true,
  "daysOfWeek": ["mon", "tue", "wed", "thu", "fri"]
}
```

`daysOfWeek` 可选，不填则每天执行。

### 3. 添加 Interval 任务

按固定间隔循环：

```json
{
  "id": "interval-health-check",
  "type": "interval",
  "intervalMinutes": 60,
  "command": "bash scripts/health-check.sh",
  "description": "每小时检查服务健康状态",
  "enabled": true,
  "startTime": "08:00",
  "endTime": "22:00"
}
```

`startTime` / `endTime` 限制执行时间窗口，避免深夜执行。

### 4. 添加 Once 任务

一次性定时执行：

```json
{
  "id": "once-migration",
  "type": "once",
  "datetime": "2026-05-20T10:00:00+08:00",
  "command": "bash scripts/migrate-data.sh",
  "description": "周二上午执行数据迁移",
  "enabled": true,
  "autoDelete": true
}
```

`autoDelete: true` 表示执行后自动从配置中移除。

### 5. 日志与监控

```bash
# 查看调度日志
ls .claude/scheduled-tasks-logs/

# 日志格式
cat .claude/scheduled-tasks-logs/2026-05-17_daily-views-sync.log
```

日志内容示例：

```
[2026-05-17T09:00:02+08:00] START daily-views-sync
[2026-05-17T09:00:02+08:00] CMD: sync-unifuncs-views-to-feishu.ps1
[2026-05-17T09:00:15+08:00] OK: exit code 0
[2026-05-17T09:00:15+08:00] OUTPUT: Synced 42 records to Feishu
[2026-05-17T09:00:15+08:00] END daily-views-sync (13s)
```

### 6. 错误处理

```json
{
  "errorHandling": {
    "maxRetries": 2,
    "retryDelayMinutes": 5,
    "notifyOnFailure": true,
    "notifyChannel": "memory-bus",
    "failureEvent": {
      "eventType": "scheduled-task-failed",
      "emitTo": "data/memory-bus/events/"
    }
  }
}
```

> 📸 截图：[任务失败后的重试日志]

## 实战示例

### 完整的数据运营调度

```json
{
  "scheduledDispatchSettings": {
    "enabled": true,
    "timezone": "Asia/Shanghai",
    "tasks": [
      {
        "id": "morning-views-sync",
        "type": "daily",
        "time": "08:00",
        "command": "bash scripts/unifuncs-share-sync.mjs",
        "description": "早 8 点抓取浏览量"
      },
      {
        "id": "morning-feishu-writeback",
        "type": "daily",
        "time": "08:30",
        "command": "bash scripts/sync-unifuncs-views-to-feishu.ps1",
        "description": "8:30 回写飞书",
        "dependsOn": "morning-views-sync"
      },
      {
        "id": "evening-serp-check",
        "type": "daily",
        "time": "20:00",
        "command": "bash scripts/check-serp-rankings.ps1",
        "description": "晚 8 点检查排名"
      }
    ]
  }
}
```

## 验证

- [ ] 配置文件 JSON 格式正确
- [ ] 时区设置与本地一致
- [ ] 任务命令路径正确且可执行
- [ ] 日志目录存在且可写
- [ ] 错误重试机制正常工作

## 常见问题

**Q: 任务执行时 Agent 不在线怎么办？**
A: 需要 Golutra 调度器常驻运行。纯 Claude Code 环境下，任务只在会话活跃时执行。

**Q: 多个任务同时触发会冲突吗？**
A: 默认串行执行。可设置 `concurrent: true` 允许并行。

**Q: 如何临时禁用某个任务？**
A: 设置 `"enabled": false`，不需要删除配置。

**Q: dependsOn 是什么？**
A: 声明任务依赖。`morning-feishu-writeback` 会等 `morning-views-sync` 完成后再执行。

## 下一步

自动化调度配好了，最后学习项目最佳实践避免常见坑 → [11-best-practices.md](./11-best-practices.md)
