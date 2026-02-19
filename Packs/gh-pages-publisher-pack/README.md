# GitHub Pages Publisher Pack

## 用途

一键发布 Markdown 文章到 GitHub Pages，并推送到 UniFuncs 进行 SEO 优化。

## 核心能力

- **GitHub Pages 发布：** 自动创建 commit 并发布
- **UniFuncs 推送：** 推送到 UniFuncs 进行索引优化
- **Slug 生成：** 自动从关键词生成 URL 友好的路径
- **Jekyll 兼容：** 生成 Jekyll 格式的 front matter

## 配置示例

```json
{
  "skills": {
    "gh-pages-unifuncs-publisher": {
      "source": "github.com/1596941391qq/gh-pages-unifuncs-publisher",
      "enabled": true
    }
  }
}
```

## setting.json

```json
{
  "github": {
    "token": "ghp_xxx",
    "owner": "your-username",
    "repo": "your-username.github.io",
    "branch": "main"
  },
  "publish": {
    "target_language": "zh",
    "promotion_website": "your-site.com",
    "promotion_keywords": ["AI", "SEO"]
  },
  "unifuncs": {
    "api_key": "sk-xxx",
    "important_prompt": "优化SEO并推送到Google Index"
  }
}
```

## 使用方法

```bash
# 发布文章
./publish.sh "关键词" "./article.md" "./setting.json"

# 干跑测试
./publish.sh "关键词" "./article.md" "./setting.json" "true"
```

## 输出

- **GitHub Pages URL：** `https://{owner}.github.io/{slug}/`
- **UniFuncs Task ID：** 用于追踪索引状态

## 依赖

- GitHub Token (有 repo 权限)
- UniFuncs API Key
- Node.js (用于 JSON 解析)

## 实现说明

实际代码位于：
`github.com/1596941391qq/gh-pages-unifuncs-publisher`
