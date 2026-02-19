# Skill Router Pack

## 用途

解决用户"不知道用哪个 skill"的痛点。自动分析用户输入，推荐最匹配的 marketing skill。

## 工作原理

1. **关键词匹配** - 匹配 skill 关键词库
2. **正则模式** - 匹配复杂意图模式  
3. **置信度评分** - 计算匹配分数
4. **多候选返回** - 返回 Top 3 推荐

## 配置示例

```json
{
  "skills": {
    "skill-router": {
      "source": "github.com/1596941391qq/ai-openclaw-skeletons-dev",
      "enabled": true
    }
  }
}
```

## 使用效果

```
用户: "如何批量生成SEO内容"
→ 推荐: programmatic-seo (95% 置信度)

用户: "帮我写cold email开发客户"
→ 推荐: cold-email (100% 置信度)
```

## 与其他 Pack 的关系

- **输入**: 用户自然语言
- **输出**: 推荐 skill 名称
- **依赖**: 无
- **被依赖**: 可作为前置路由层

## 实现说明

实际 skill 代码位于:
`github.com/1596941391qq/ai-openclaw-skeletons-dev/Packs/skill-router-pack/`
