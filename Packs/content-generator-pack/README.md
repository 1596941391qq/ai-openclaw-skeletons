# Content Generator Pack

## 用途

根据 PSEO Pipeline 生成的关键词和大纲，自动生成完整的文章内容。

## 工作流程

1. 读取 PSEO Pipeline 生成的项目文件
2. 解析每个文章的关键词和大纲
3. 生成完整的 Markdown 文章（包含 SEO 优化结构）
4. 输出到指定目录，等待发布

## 配置示例

```json
{
  "skills": {
    "content-generator": {
      "source": "github.com/1596941391qq/gh-pages-unifuncs-publisher",
      "enabled": true
    }
  }
}
```

## 使用方法

```bash
# 从 PSEO 项目生成内容
node content-generator/generate.mjs <pseo-project.json> <output-dir>

# 示例
node content-generator/generate.mjs \
  ~/.openclaw/pseo-projects/my-project/pseo-project.json \
  ./generated-articles
```

## 输入

PSEO Pipeline 生成的项目文件：
```json
{
  "steps": {
    "contentGeneration": {
      "articles": [
        {
          "keyword": "ai digital worker",
          "title": "AI Digital Worker: Complete Guide 2026",
          "outline": [
            "Introduction to AI digital worker",
            "Why AI digital worker matters",
            "How to implement AI digital worker",
            ...
          ]
        }
      ]
    }
  }
}
```

## 输出

生成的 Markdown 文件：
```
./generated-articles/
├── ai-digital-worker.md
├── openclaw-skeleton.md
└── seo-automation.md
```

## 文章结构

生成的文章包含：
- SEO 优化的标题
- 元数据（发布日期、关键词）
- 引言部分
- 大纲扩展的 6 个章节
- 结论和行动号召
- 标准化的 front matter

## 与 PSEO Pipeline 的关系

```
PSEO Pipeline          Content Generator          Publisher
     ↓                        ↓                         ↓
关键词研究           生成完整文章内容           发布到 GitHub
内容大纲             (本 Pack)                  推送到 UniFuncs
```

## 实现说明

实际代码位于：
`github.com/1596941391qq/gh-pages-unifuncs-publisher/content-generator/`

注意：当前版本使用模板生成内容。生产环境建议接入 LLM API 生成高质量内容。
