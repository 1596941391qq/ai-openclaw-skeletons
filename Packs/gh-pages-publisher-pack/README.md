# GitHub Pages Publisher Pack

## 用途

一键发布 Markdown 文章到 GitHub Pages，并推送到 UniFuncs 进行 SEO 优化。

## 核心能力

- **GitHub Pages 发布：** 自动创建 commit 并发布
- **UniFuncs 推送：** 推送到 UniFuncs 进行索引优化
- **Slug 生成：** 自动从关键词生成 URL 友好的路径
- **Jekyll 兼容：** 生成 Jekyll 格式的 front matter
- **跨平台：** 支持 PowerShell (Windows) 和 Bash (Linux/macOS)

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
    "promotion_website": "https://your-site.com",
    "promotion_keywords": ["AI", "SEO"]
  },
  "unifuncs": {
    "api_key": "sk-xxx",
    "important_prompt": "优化SEO并推送到Google Index"
  }
}
```

## 使用方法

### PowerShell (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File .\cil\cil-gh-pages-publisher.ps1 publish `
  --keyword "your-keyword" `
  --article_md ".\article.md" `
  --setting_file ".\setting.json" `
  --dry_run
```

### Bash (Linux/macOS)

```bash
./cil/cil-gh-pages-publisher.sh publish \
  --keyword "your-keyword" \
  --article_md "./article.md" \
  --setting_file "./setting.json" \
  --dry_run
```

## CLI 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--keyword` | 文章关键词 | 必填 |
| `--article_md` | Markdown 文件路径 | 必填 |
| `--setting_file` | 配置文件路径 | `./setting.json` |
| `--dry_run` | 干跑模式（不实际发布） | 无 |

## 输出

- **GitHub Pages URL：** `https://{owner}.github.io/{slug}/`
- **UniFuncs Task ID：** 用于追踪索引状态

### 示例输出

```json
{
  "success": true,
  "keyword": "your-keyword",
  "article_title": "Your Article Title",
  "publish_url": "https://your-username.github.io/your-keyword/",
  "github": {
    "owner": "your-username",
    "repo": "your-repo",
    "slug": "your-keyword"
  },
  "unifuncs": {
    "task_id": "...",
    "status": "created"
  }
}
```

## 依赖

### 通用
- GitHub Token (有 repo 权限)
- UniFuncs API Key

### PowerShell
- PowerShell 5.1+ 或 PowerShell Core 7+
- Git

### Bash
- Bash 4.0+
- Node.js (用于 JSON 解析)
- Git
- curl

## 实现说明

实际代码位于：
`github.com/1596941391qq/gh-pages-unifuncs-publisher`

包含：
- `cil/cil-gh-pages-publisher.ps1` - PowerShell 入口
- `cil/publish-gh-pages-unifuncs.ps1` - PowerShell 主逻辑
- `cil/cil-gh-pages-publisher.sh` - Bash 入口
- `cil/publish-gh-pages-unifuncs.sh` - Bash 主逻辑
