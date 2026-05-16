# 08 — Memory Bus 跨 Pack 通信

> 📹 [视频教程待录] — 本篇对应视频录制后将在此更新链接

## 你将学到

- Memory Bus 的设计动机
- 事件 Schema 定义
- 发布（emit）与消费（consume）模式
- 实战：两个 Pack 通过 Memory Bus 通信

## 前置条件

- 完成 [07-orchestrator-design.md](./07-orchestrator-design.md)
- 理解发布/订阅模式
- 了解 JSON Schema 基础

## 核心概念

Memory Bus 是 OpenClaw 的跨 Pack 异步通信机制。它解决的问题：

- Pack A 完成后，Pack B 需要知道结果
- 多个 Pack 需要共享状态
- 不同频道的 Agent 需要交换信息

```
Pack A ──emit──→ [Memory Bus] ──consume──→ Pack B
                     │
                     └──consume──→ Pack C
```

通信通过文件系统实现，不依赖外部消息队列。

> 📸 截图：[Memory Bus 数据流示意图]

## 事件 Schema

所有事件必须遵循预定义的 Schema：

```json
// data/memory-bus/schemas/keyword-mined.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "KeywordMined",
  "description": "挖词完成事件",
  "required": ["eventType", "timestamp", "source", "payload"],
  "properties": {
    "eventType": {
      "const": "keyword-mined"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "source": {
      "type": "string",
      "description": "发送方 Pack 名称"
    },
    "payload": {
      "type": "object",
      "required": ["brand", "keywords"],
      "properties": {
        "brand": { "type": "string" },
        "keywords": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "term": { "type": "string" },
              "volume": { "type": "number" },
              "kd": { "type": "number" }
            }
          }
        },
        "totalCount": { "type": "number" }
      }
    }
  }
}
```

## 步骤

### 1. 定义事件目录结构

```bash
mkdir -p data/memory-bus/{schemas,events,consumed}
```

```
data/memory-bus/
├── schemas/          # 事件 Schema 定义
│   ├── keyword-mined.schema.json
│   ├── article-published.schema.json
│   └── views-synced.schema.json
├── events/           # 待消费的事件队列
│   └── 2026-05-17T10-00-00_keyword-mined_nichedigger.json
└── consumed/         # 已消费的事件归档
    └── ...
```

### 2. 发布事件（Emit）

在 Pack 执行完成后，写入事件文件：

```typescript
// lib/memory-bus.ts

interface BusEvent {
  eventType: string;
  timestamp: string;
  source: string;
  payload: Record<string, unknown>;
}

export function emit(event: BusEvent): void {
  const filename = `${event.timestamp}_${event.eventType}_${event.source}.json`;
  const filepath = `data/memory-bus/events/${filename}`;

  // 写入事件文件
  Bun.write(filepath, JSON.stringify(event, null, 2));
  console.log(`[MemoryBus] Emitted: ${event.eventType} from ${event.source}`);
}

// 使用示例
emit({
  eventType: 'keyword-mined',
  timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
  source: 'nichedigger-pack',
  payload: {
    brand: '302ai',
    keywords: [
      { term: 'ai writing tool', volume: 12000, kd: 35 },
      { term: 'ai content generator', volume: 8500, kd: 42 }
    ],
    totalCount: 2
  }
});
```

### 3. 消费事件（Consume）

```typescript
// lib/memory-bus.ts

export function consume(eventType: string): BusEvent[] {
  const eventsDir = 'data/memory-bus/events';
  const consumedDir = 'data/memory-bus/consumed';
  const files = readdirSync(eventsDir)
    .filter(f => f.includes(eventType));

  const events: BusEvent[] = [];

  for (const file of files) {
    const content = readFileSync(`${eventsDir}/${file}`, 'utf-8');
    events.push(JSON.parse(content));

    // 移动到已消费目录
    renameSync(`${eventsDir}/${file}`, `${consumedDir}/${file}`);
  }

  console.log(`[MemoryBus] Consumed ${events.length} ${eventType} events`);
  return events;
}

// 使用示例（在 publisher-pack 中）
const keywordEvents = consume('keyword-mined');
for (const event of keywordEvents) {
  const { brand, keywords } = event.payload;
  // 处理挖到的关键词...
}
```

### 4. Schema 验证

```typescript
import Ajv from 'ajv';

export function validateEvent(event: BusEvent): boolean {
  const ajv = new Ajv();
  const schemaPath = `data/memory-bus/schemas/${event.eventType}.schema.json`;
  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
  const validate = ajv.compile(schema);

  if (!validate(event)) {
    console.error(`[MemoryBus] Validation failed:`, validate.errors);
    return false;
  }
  return true;
}
```

### 5. 常用事件类型

| 事件类型 | 发送方 | 消费方 | 说明 |
|---------|--------|--------|------|
| `keyword-mined` | nichedigger | publisher | 挖词完成 |
| `article-published` | publisher | feishu-sync | 文章发布 |
| `views-synced` | unifuncs-sync | monitoring | 浏览量更新 |
| `state-changed` | orchestrator | any | 状态变更通知 |

> 📸 截图：[events 目录中的事件文件列表]

## 验证

- [ ] Schema 文件格式正确（用 ajv 验证）
- [ ] emit 后事件文件出现在 `events/` 目录
- [ ] consume 后事件移动到 `consumed/` 目录
- [ ] 无效事件被 Schema 验证拦截
- [ ] 多个消费者不会重复消费同一事件

## 常见问题

**Q: 事件文件会无限增长吗？**
A: `consumed/` 目录建议定期清理（保留 7 天）。可用 cron 任务自动清理。

**Q: 两个 Pack 同时消费同一事件怎么办？**
A: 当前设计是单消费者模式（先到先得）。多消费者场景用 Schema 中的 `consumers` 字段声明。

**Q: 事件顺序重要吗？**
A: 文件名包含时间戳，消费时按时间排序。

**Q: 能跨机器通信吗？**
A: 当前基于本地文件系统。跨机器需要替换为网络存储或消息队列。

## 下一步

通信机制有了，接下来学习 Hook 系统实现治理 → [09-hook-system.md](./09-hook-system.md)
