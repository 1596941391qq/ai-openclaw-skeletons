# 11 — 最佳实践与常见坑

> 📹 [视频教程待录] — 本篇对应视频录制后将在此更新链接

## 你将学到

- 命名规范与目录组织
- Source-of-truth 管理原则
- 安全实践清单
- 扩展性设计要点
- 常见反模式与解决方案

## 前置条件

- 完成前 10 篇教程
- 有实际项目开发经验
- 准备将 OpenClaw 用于生产环境

## 命名规范

### Pack 命名

```
# 好的命名
gh-pages-publisher-pack    # 功能明确，带 -pack 后缀
nichedigger-pack           # 品牌名 + pack
keyword-scorer-pack        # 动作 + 对象 + pack

# 差的命名
my-pack                    # 无意义
utils-pack                 # 太泛
pack1                      # 编号命名
```

### Bundle 命名

```
# 好的命名
Bundles/PSEO/              # 业务线名称
Bundles/nichedigger/       # 能力名称

# 差的命名
Bundles/pipeline-1/        # 编号
Bundles/new-flow/          # 临时命名
```

### 文件命名

```
# 脚本：动词-名词 格式
publish-gh-pages-unifuncs.ps1
sync-unifuncs-views-to-feishu.ps1
run-nichedigger.ps1

# Schema：名词-动词.schema.json
keyword-mined.schema.json
article-published.schema.json

# 配置：功能名.json
pack.openclaw.json
bundle.json
workspace.json
```

> 📸 截图：[规范命名的项目目录结构]

## Source-of-Truth 管理

### 原则：每个数据只有一个权威来源

```
┌─────────────────────────────────────────────┐
│  数据类型        │  Source-of-Truth          │
├─────────────────────────────────────────────┤
│  品牌策略        │  workspace/seo-strategy/  │
│  关键词库        │  飞书 nichedigger-{brand} │
│  发布状态        │  飞书 pseo-{brand}-{site} │
│  排名数据        │  飞书 pseo-master         │
│  Agent 行为      │  CLAUDE.md / AGENTS.md    │
│  调度配置        │  .claude/settings.json    │
└─────────────────────────────────────────────┘
```

### 反模式：多源冲突

```
# 错误：同一数据在多处维护
workspace/keywords.json     ← 本地文件
飞书 nichedigger-302ai      ← 飞书表
memory/keywords-cache.json  ← 缓存

# 正确：飞书表是唯一 source-of-truth，其他是只读缓存
飞书 nichedigger-302ai      ← 权威源（可写）
workspace/keywords.json     ← 本地缓存（只读，定期同步）
```

### 修改前必问

在修改任何数据前，先回答：

1. 这个数据的 source-of-truth 在哪？
2. 我要改的是源还是缓存？
3. 改完后需要同步到哪里？

## 安全实践

### 密钥管理

```bash
# .env 文件绝不提交
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore

# 使用 .env.example 作为模板
cp .env .env.example
# 手动清空所有值
```

### Hook 安全防护

```json
{
  "hooks": {
    "before:tool_call": [
      {
        "name": "secret-guard",
        "handler": ".claude/hooks/secret-guard.js",
        "match": { "pathPattern": "**/.env*" }
      },
      {
        "name": "destructive-guard",
        "handler": ".claude/hooks/destructive-guard.js",
        "match": { "commandPattern": "*rm -rf*|*drop table*|*--force*" }
      }
    ]
  }
}
```

### 权限最小化

```json
{
  "permissions": {
    "allow": [
      "Read(*)",
      "Write(workspace/**)",
      "Bash(bun *)"
    ],
    "deny": [
      "Write(.env*)",
      "Bash(curl * | bash)",
      "Bash(rm -rf *)"
    ]
  }
}
```

> 📸 截图：[安全配置的完整示例]

## 扩展性设计

### 新增能力的检查清单

添加新 Pack/Bundle 前，回答：

- [ ] 现有 Pack 能否通过参数扩展实现？
- [ ] 是否有 70% 以上可复用的现有链路？
- [ ] 新增后是否需要更新 PSEO-INDEX.md？
- [ ] 是否定义了清晰的输入/输出契约？
- [ ] 是否有对应的 Schema 验证？

### 渐进式复杂度

```
阶段 1：单 Pack，手动触发
阶段 2：Bundle 组合，手动触发
阶段 3：Orchestrator 编排，半自动
阶段 4：定时调度，全自动
```

不要跳级。每个阶段验证稳定后再进入下一阶段。

### 文档同步规则

改了执行链路后，必须同步更新：

1. `PSEO-INDEX.md` — 资产地图
2. 对应脚本的注释头
3. `CLAUDE.md` 中的相关章节
4. Memory 目录中的频道文档

## 常见坑

### 坑 1：平行系统

```
# 症状：同一功能有两套实现
scripts/sync-views.sh          ← 旧版
scripts/sync-unifuncs-views.mjs ← 新版

# 解决：保留一个，删除另一个，更新所有引用
```

### 坑 2：幽灵依赖

```
# 症状：脚本依赖未声明的环境变量或文件
# 解决：在 pack.openclaw.json 中声明所有依赖
{
  "dependencies": {
    "env": ["FEISHU_APP_ID", "FEISHU_APP_SECRET"],
    "files": ["workspace/seo-strategy/INDEX.md"],
    "packs": ["nichedigger-pack"]
  }
}
```

### 坑 3：Memory 污染

```
# 症状：Agent 读取了错误频道的 memory
# 解决：严格按频道隔离，启动时验证频道身份
```

### 坑 4：过度抽象

```
# 症状：为了"通用性"加了三层 wrapper
# 解决：Article VIII — 信任框架，直接使用，不加不必要的抽象层
```

### 坑 5：忘记回写

```
# 症状：本地执行成功但飞书表没更新
# 解决：每个写操作链路必须包含回写步骤，在 Bundle 中显式声明
```

## 交付质量检查

每次改动提交前，过一遍：

| 检查项 | 通过标准 |
|--------|---------|
| 入口明确 | 能一句话说出入口脚本 |
| 依赖声明 | 所有依赖在配置中列出 |
| 产物位置 | 输出文件路径已确定 |
| 回写链路 | 状态变更能同步到 source-of-truth |
| 文档同步 | 相关文档已更新 |
| 安全检查 | 无硬编码密钥，无危险操作 |

## 验证

- [ ] 项目命名符合规范
- [ ] Source-of-truth 无冲突
- [ ] 安全 Hook 已配置
- [ ] 无平行系统存在
- [ ] 文档与代码一致

## 常见问题

**Q: 项目越来越大，怎么保持可维护？**
A: 定期运行"先复用后新增"检查。每月清理一次未使用的脚本和配置。

**Q: 多人协作时如何避免冲突？**
A: 通过频道隔离 + Memory Contract 明确数据归属。每个频道有且只有一个负责 Agent。

**Q: 什么时候该拆分仓库？**
A: 当 Pack 数量超过 15 个，或有独立部署需求时，考虑拆分为多仓库 + Git Submodule。

**Q: 如何评估系统健康度？**
A: 检查：无孤立脚本、无重复能力、文档覆盖率 > 80%、所有链路有测试。

## 总结

OpenClaw Skeletons 的核心哲学：

1. **复用优先** — 先找现有能力，再考虑新建
2. **契约驱动** — Schema、Contract、AGENTS.md 定义边界
3. **渐进复杂** — 从简单开始，验证后再升级
4. **单一真相** — 每个数据只有一个权威来源
5. **可观测** — Hook、日志、Memory Bus 让系统透明

恭喜你完成了全部教程。现在你已经具备了使用 OpenClaw Skeletons 构建生产级 AI Agent 工作流的能力。
