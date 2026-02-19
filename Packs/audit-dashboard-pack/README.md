# Audit Dashboard Pack

## 用途

Web UI 可视化审计日志，替代 CLI 查看方式。

## 功能

- 📊 实时监控总会话、调用次数、权限拒绝
- 📋 会话列表及状态
- 🚫 权限拒绝事件追踪
- 📈 工具使用统计

## 使用方法

```bash
# 启动本地服务器
node server.mjs

# 打开浏览器访问
open http://localhost:3456
```

## 界面预览

- 深色主题仪表盘
- 实时数据刷新（30秒间隔）
- 响应式设计

## 配置示例

```json
{
  "skills": {
    "audit-dashboard": {
      "source": "github.com/1596941391qq/ai-openclaw-skeletons-dev",
      "enabled": true
    }
  }
}
```

## 实现说明

实际代码位于:
`github.com/1596941391qq/ai-openclaw-skeletons-dev/Packs/audit-dashboard-pack/`
