# Context Preloader Pack

## 用途

SessionStart 时自动加载 product-marketing-context，避免每个 skill 重复读取上下文。

## 解决的问题

**优化前:**
- 用户: "帮我做 SEO 审计"
- AI: "首先，你的目标客户是谁？"
- （重复问答）

**优化后:**
- 用户: "帮我做 SEO 审计"  
- AI: "基于你的产品营销上下文（AI一体化出海解决方案），我建议..."

## 加载的文件

1. `.openclaw/product-marketing-context.md`
2. `.openclaw/content-strategy.md`
3. `.openclaw/analytics-tracking-plan.md`

## 配置示例

```json
{
  "hooks": {
    "SessionStart": ["./hooks/preloadContext.mjs"]
  },
  "contextFiles": [
    ".openclaw/product-marketing-context.md"
  ]
}
```

## 实现说明

实际代码位于:
`github.com/1596941391qq/ai-openclaw-skeletons-dev/Packs/context-preloader-pack/`
