# Audit Core Pack

通用审计与治理基础包。

## 能力

- 工具权限治理（tools.allow / tools.deny）
- 审计日志记录与会话归档
- 可与 runtime hooks.internal 配置联动

## 配置示例（runtime 对齐）

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {},
      "handlers": []
    }
  }
}
```

> 说明：公开仓只提供通用骨架与配置契约，具体 hook 实现可在私有仓扩展。
