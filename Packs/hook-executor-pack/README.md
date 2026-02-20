# Hook Executor Pack

Runtime Hook 执行治理适配层。

## 目标

- 统一 hooks.internal 配置入口
- 为后续扩展 entries/handlers 提供稳定骨架

## 配置示例（runtime 对齐）

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "load": { "extraDirs": [] },
      "entries": {},
      "handlers": []
    }
  }
}
```

## 说明

公开仓默认保持最小实现与最小约束，不绑定具体业务 hook。
