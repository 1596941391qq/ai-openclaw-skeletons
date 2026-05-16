# 01 — 从零搭建你的第一个 AI Agent

> 📹 [视频教程待录] — 本篇对应视频录制后将在此更新链接

## 你将学到

- 克隆并初始化 OpenClaw Skeletons 项目
- 安装必要依赖
- 配置环境变量
- 运行你的第一个 AI Agent 并看到输出

## 前置条件

- Node.js >= 18（推荐用 `nvm` 管理版本）
- Git 已安装
- 一个终端（macOS/Linux 原生终端，Windows 用 WSL2 或 Git Bash）
- Claude API Key 或本地 Claude Code 环境

## 步骤

### 1. 克隆仓库

```bash
git clone https://github.com/your-org/openclaw-skeletons.git
cd openclaw-skeletons
```

> 📸 截图：[克隆完成后的目录结构]

### 2. 安装依赖

```bash
# 推荐使用 bun（更快）
bun install

# 或者用 npm
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入必要的 Key：

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx
```

> 📸 截图：[.env 文件配置示例（脱敏）]

### 4. 验证项目结构

```bash
# 确认核心目录存在
ls Packs/ Bundles/ Orchestrators/ workspace/
```

你应该看到类似输出：

```
Packs/:
gh-pages-publisher-pack/  nichedigger-pack/

Bundles/:
PSEO/  nichedigger/

Orchestrators/:
SEO/

workspace/:
seo-strategy/  keyword-mining/
```

### 5. 运行第一个 Agent

```bash
# 使用 Claude Code 进入项目
claude

# 或者直接执行一个 Pack 的 CLI 入口
cd Packs/gh-pages-publisher-pack
bash cil/publish-gh-pages-unifuncs.ps1 --dry-run
```

> 📸 截图：[Agent 首次运行的终端输出]

### 6. 确认 CLAUDE.md 被加载

进入 Claude Code 后，Agent 会自动读取项目根目录的 `CLAUDE.md`。你可以通过以下方式验证：

```bash
# 在 Claude Code 中询问
> 这个项目的主任务是什么？
```

Agent 应该回答关于 PSEO 业务闭环的内容。

## 验证

完成以上步骤后，确认：

- [ ] 项目克隆成功，目录结构完整
- [ ] 依赖安装无报错
- [ ] `.env` 配置完成
- [ ] Agent 能正常启动并响应

## 常见问题

**Q: `bun install` 报错找不到 bun？**
A: 安装 bun：`curl -fsSL https://bun.sh/install | bash`

**Q: Agent 启动后不读取 CLAUDE.md？**
A: 确认你在项目根目录启动，且 `CLAUDE.md` 文件存在于当前目录。

**Q: Windows 下路径报错？**
A: 切换到 WSL2 环境，或确保使用正斜杠路径。

**Q: API Key 无效？**
A: 检查 `.env` 中的 Key 是否有多余空格或换行符。

## 下一步

项目跑起来了，接下来学习如何将它接入 Golutra 工作空间 → [02-golutra-integration.md](./02-golutra-integration.md)
