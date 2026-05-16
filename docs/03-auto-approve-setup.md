# 03 — 自动免确认机制

> 📹 [视频教程待录] — 本篇对应视频录制后将在此更新链接

## 你将学到

- 理解双层免确认架构
- 配置 Golutra 层的 `--dangerously-skip-permissions`
- 配置 Claude 层的 `.claude/settings.local.json`
- 安全边界：哪些操作应该保留确认

## 前置条件

- 完成 [02-golutra-integration.md](./02-golutra-integration.md)
- 理解 Agent 权限模型
- 明确你的安全需求

## 核心概念

OpenClaw 的免确认机制分两层：

```
┌─────────────────────────────────────┐
│  Layer 1: Golutra 调度层            │
│  --dangerously-skip-permissions     │
│  控制 Agent 启动时的全局权限        │
├─────────────────────────────────────┤
│  Layer 2: Claude settings.local     │
│  .claude/settings.local.json        │
│  控制具体工具调用的细粒度权限       │
└─────────────────────────────────────┘
```

> 📸 截图：[双层权限架构示意图]

## 步骤

### 1. Golutra 层配置

在 Golutra 启动 Agent 时，通过参数跳过全局权限确认：

```bash
# 启动时跳过权限确认（仅限受信环境）
golutra start --agent engineer \
  --dangerously-skip-permissions \
  --channel pseo-article-management
```

等效配置写入 `workspace.json`：

```json
{
  "agents": {
    "engineer": {
      "skipPermissions": true,
      "allowedOperations": ["file:read", "file:write", "bash:execute"]
    }
  }
}
```

### 2. Claude 层配置

创建 `.claude/settings.local.json`（不提交到 Git）：

```json
{
  "permissions": {
    "allow": [
      "Bash(bun *)",
      "Bash(npm *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(mkdir *)",
      "Bash(cp *)",
      "Read(*)",
      "Write(workspace/*)",
      "Write(memory/*)",
      "Edit(*)"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)",
      "Bash(curl * | bash)",
      "Write(.env*)",
      "Write(*credentials*)"
    ]
  }
}
```

> 📸 截图：[settings.local.json 在项目中的位置]

### 3. 项目级 settings.json（可提交）

```json
{
  "permissions": {
    "allow": [
      "Bash(bun run *)",
      "Bash(bun test *)",
      "Read(*)"
    ]
  }
}
```

这个文件提交到仓库，作为团队共享的基线权限。

### 4. 验证权限生效

```bash
# 进入 Claude Code
claude

# 测试：以下操作应该不弹确认
> 读取 workspace/seo-strategy/INDEX.md
> 执行 ls Packs/

# 测试：以下操作应该被拦截或要求确认
> 删除 .env 文件
> git push --force
```

### 5. 安全边界清单

即使开启免确认，以下操作建议始终保留人工确认：

| 操作类型 | 建议 | 原因 |
|---------|------|------|
| 删除文件 | 保留确认 | 不可逆 |
| 修改 .env | 保留确认 | 含密钥 |
| git push | 保留确认 | 影响远程 |
| 网络请求 | 视情况 | 可能泄露数据 |
| 安装依赖 | 免确认 | 可回滚 |
| 读取文件 | 免确认 | 无副作用 |

## 验证

- [ ] Golutra 启动 Agent 时不弹权限确认
- [ ] 白名单内的 Bash 命令直接执行
- [ ] 黑名单内的操作被正确拦截
- [ ] `.claude/settings.local.json` 未被提交到 Git

## 常见问题

**Q: 设置了 allow 但还是弹确认？**
A: 检查 glob 模式是否匹配。`Bash(bun *)` 匹配 `bun run test` 但不匹配 `bunx`。

**Q: deny 和 allow 冲突时谁优先？**
A: deny 优先。如果一个操作同时匹配 allow 和 deny，会被拦截。

**Q: 团队成员权限不同怎么办？**
A: `settings.json`（提交）放共享基线，`settings.local.json`（不提交）放个人扩展。

**Q: 如何临时恢复确认？**
A: 删除 `settings.local.json` 或移除 `--dangerously-skip-permissions` 参数。

## 下一步

权限配好了，接下来学习如何编写 AGENTS.md 定义 Agent 行为契约 → [04-agents-md-guide.md](./04-agents-md-guide.md)
