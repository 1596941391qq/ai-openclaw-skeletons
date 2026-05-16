# 02 — Golutra 工作空间适配

> 📹 [视频教程待录] — 本篇对应视频录制后将在此更新链接

## 你将学到

- Golutra 工作空间的核心概念
- 配置 `workspace.json` 管理多 Agent 协作
- 成员（members）注册与权限分配
- 模板变量（template variables）的使用场景

## 前置条件

- 完成 [01-quick-start.md](./01-quick-start.md)
- 了解 JSON 基本语法
- 项目已能正常运行

## 核心概念

Golutra 是 OpenClaw 的工作空间管理层，负责：

1. **多频道隔离** — 不同业务线在独立频道中运行
2. **成员管理** — 控制哪些 Agent 可以访问哪些资源
3. **模板变量** — 在 onboarding 时注入上下文
4. **Roadmap 统一** — 所有频道共享一个 roadmap 入口

## 步骤

### 1. 初始化 Golutra 目录

```bash
mkdir -p .golutra
```

### 2. 创建 workspace.json

```json
{
  "name": "openclaw-skeletons",
  "version": "1.0.0",
  "description": "PSEO 业务自动化工作空间",
  "rootDir": ".",
  "members": [
    {
      "id": "engineer-agent",
      "role": "engineer",
      "channels": ["pseo-article-management", "article-data-monitoring"],
      "permissions": ["read", "write", "execute"]
    },
    {
      "id": "strategy-agent",
      "role": "strategist",
      "channels": ["seo-strategy-and-consulting"],
      "permissions": ["read", "write"]
    }
  ],
  "templateVariables": {
    "PROJECT_ROOT": "E:\ai-openclaw-skeletons-dev",
    "DEFAULT_BRAND": "302ai",
    "FEISHU_BASE_URL": "https://open.feishu.cn/open-apis"
  },
  "onboarding": {
    "entryFile": "CLAUDE.md",
    "contextFiles": ["PSEO-INDEX.md", ".golutra/roadmap.json"]
  }
}
```

> 📸 截图：[workspace.json 在编辑器中的完整视图]

### 3. 配置 Roadmap

```bash
cat > .golutra/roadmap.json << 'ROADMAP'
{
  "roadmapsByConversation": {
    "01KJW8J5ZW40KW47HVS3FKVR9M": {
      "channel": "overall-framework-discussion-channel",
      "tasks": []
    }
  },
  "globalTasks": [],
  "lastUpdated": "2026-05-17T00:00:00Z"
}
ROADMAP
```

### 4. 成员 Onboarding 模板

当新 Agent 加入频道时，Golutra 会注入模板变量：

```markdown
# Onboarding for {{member.id}}

你被分配到频道：{{channel.name}}
项目根目录：{{PROJECT_ROOT}}
默认品牌：{{DEFAULT_BRAND}}

## 你的职责
{{member.role}} 角色负责该频道内的所有 {{member.permissions}} 操作。

## 启动顺序
1. 读取 CLAUDE.md
2. 读取 .golutra/roadmap.json
3. 进入频道 memory 目录
```

> 📸 截图：[Agent onboarding 时的终端输出]

### 5. 频道与 Memory 目录映射

```bash
# 确认 memory 目录结构
ls memory/
```

每个频道对应一个 memory 子目录，Agent 只在自己的频道 memory 内工作：

```
memory/
├── overall-framework-discussion-channel/
├── pseo-article-management-channel/
├── nichedigger-keyword-table-channel/
├── article-data-monitoring-channel/
└── seo-strategy-and-consulting-channel/
```

## 验证

- [ ] `.golutra/workspace.json` 格式正确（`jq . .golutra/workspace.json`）
- [ ] `.golutra/roadmap.json` 可被 Agent 正常读取
- [ ] 新 Agent 进入时能正确识别频道身份
- [ ] 模板变量在 onboarding 时被正确替换

## 常见问题

**Q: Agent 进入后不识别频道？**
A: 检查 `roadmapsByConversation` 中的 conversationId 是否与当前会话匹配。

**Q: 模板变量没有被替换？**
A: 确认 `templateVariables` 中的 key 与模板中的 `{{key}}` 完全一致。

**Q: 多个 Agent 同时写同一个 memory 文件？**
A: 通过 `members` 的 `channels` 字段隔离，确保每个 Agent 只操作自己的频道。

## 下一步

工作空间配好了，接下来配置自动免确认机制提升效率 → [03-auto-approve-setup.md](./03-auto-approve-setup.md)
