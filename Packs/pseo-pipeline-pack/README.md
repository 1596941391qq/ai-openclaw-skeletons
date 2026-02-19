# PSEO Pipeline Pack

## 用途

打通 Programmatic SEO 的完整工作流：从关键词研究到内容生成到排名追踪的闭环。

## 5步流程

```
关键词研究 → 模板设计 → 内容生成 → 发布计划 → 排名追踪
```

## 输出示例

```bash
node pseo-pipeline.mjs "ecommerce-seo" "shopify seo,cross border ecommerce"

输出:
- 关键词机会分析 (3个关键词, 10,337月搜索量)
- 内容模板结构 (6个section, 2500字目标)
- 批量内容计划 (3篇文章, 7500字)
- 发布时间表 (3周发布周期)
- 排名追踪配置 (Google US/UK, 周报)
```

## 配置示例

```json
{
  "skills": {
    "pseo-pipeline": {
      "source": "github.com/1596941391qq/ai-openclaw-skeletons-dev",
      "enabled": true
    }
  }
}
```

## 与其他 Pack 的关系

- **输入**: programmatic-seo 的策略规划
- **输出**: 可执行的内容生产计划
- **下游**: 内容发布、排名追踪

## 实现说明

实际代码位于:
`github.com/1596941391qq/ai-openclaw-skeletons-dev/Packs/pseo-pipeline-pack/`
