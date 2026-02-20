# Context Preloader Pack

会话前置上下文加载骨架。

## 目标

- 在运行前加载稳定上下文与动态上下文
- 减少重复说明，提升多 Skill 协作一致性

## 默认上下文文件

1. `.openclaw/core-strategy-context.md`
2. `.openclaw/runtime-operations-context.md`

## 配置示例（runtime 对齐）

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {},
      "handlers": []
    }
  },
  "contextFiles": [
    ".openclaw/core-strategy-context.md",
    ".openclaw/runtime-operations-context.md"
  ]
}
```
