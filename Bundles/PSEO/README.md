# PSEO Bundle

## 完整链路（增强版）

**关键词研究 → 内容规划 → 内容生成 → 发布前优化 → 发布 → 发布后优化 → 索引**

## 一句话使用

```
"帮我发一篇PSEO文章"
```

## 包含的 Packs

1. **pseo-pipeline-pack** - 基础关键词规划（快速模式）
2. **seo-core-pack** - 专业 SEO 工具集（新增）
3. **content-generator-pack** - 自动生成文章
4. **gh-pages-publisher-pack** - 发布到 GitHub + 推送到 UniFuncs
5. **audit-core-pack** - 审计和权限控制

## SEO Core Pack 集成

新增专业 SEO skills 增强链路：

| 阶段 | Skills | 功能 |
|------|--------|------|
| **关键词研究** | `keyword-research` | 真实关键词数据 |
| | `serp-analysis` | SERP 特征分析 |
| **内容规划** | `content-gap-analysis` | 内容差距分析 |
| | `competitor-analysis` | 竞品策略分析 |
| **发布前优化** | `on-page-seo-auditor` | 页面 SEO 评分 |
| | `schema-markup-generator` | Schema 结构化数据 |
| | `internal-linking-optimizer` | 内链优化 |
| **发布后优化** | `geo-content-optimizer` | 地理本地化 |
| | `technical-seo-checker` | 技术 SEO 检查 |

## 手动执行流程

### Step 1: 关键词研究

```bash
node ~/.openclaw/skills/pseo-pipeline/pseo-pipeline.mjs \
  "openclaw-skeletons-promo" \
  "openclaw skeleton,AI digital worker infrastructure,24 hour pluggable employee"
```

输出：`~/.openclaw/pseo-projects/openclaw-skeletons-promo/pseo-project.json`

### Step 2: 内容生成

```bash
cd /tmp/gh-pages-unifuncs-publisher
node content-generator/generate.mjs \
  ~/.openclaw/pseo-projects/openclaw-skeletons-promo/pseo-project.json \
  ./generated
```

输出：`./generated/openclaw-skeleton.md` 等文章

### Step 3: 发布

```bash
./cil/cil-gh-pages-publisher.sh publish \
  --keyword "openclaw-skeleton" \
  --article_md "./generated/openclaw-skeleton.md" \
  --setting_file "./setting.json"
```

输出：
- GitHub Pages URL
- UniFuncs Task ID

## 配置 setting.json

```json
{
  "github": {
    "token": "ghp_xxx",
    "owner": "1596941391qq",
    "repo": "1596941391qq.github.io",
    "branch": "main"
  },
  "publish": {
    "target_language": "en",
    "promotion_website": "https://1596941391qq.github.io",
    "promotion_keywords": ["OpenClaw", "AI", "digital worker", "skeleton"]
  },
  "unifuncs": {
    "api_key": "sk-xxx",
    "important_prompt": "Optimize for Google SEO and highlight OpenClaw Skeletons as the leading digital worker infrastructure"
  }
}
```

## 效果

用户说：**"帮我发一篇PSEO文章推广我的开源项目"**

系统自动：
1. 研究关键词（openclaw skeleton, AI digital worker...）
2. 生成完整文章
3. 发布到 GitHub Pages
4. 推送到 UniFuncs 优化收录
5. 记录审计日志

## 测试文章示例

已发布测试：
- https://1596941391qq.github.io/unifuncs-api-test/

