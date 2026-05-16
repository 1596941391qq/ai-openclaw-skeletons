# OpenClaw Skeletons 教程索引

> 📹 [视频教程待录] — 本篇对应视频录制后将在此更新链接

本系列教程帮助你从零掌握 OpenClaw Skeletons 项目的核心能力，从搭建第一个 AI Agent 到设计复杂的多 Pack 编排系统。

## 学习路径

建议按顺序阅读，每篇教程都建立在前一篇的基础上。

| # | 文件 | 标题 | 说明 |
|---|------|------|------|
| 01 | [01-quick-start.md](./01-quick-start.md) | 从零搭建你的第一个 AI Agent | clone、安装依赖、配置环境、首次运行 |
| 02 | [02-golutra-integration.md](./02-golutra-integration.md) | Golutra 工作空间适配 | workspace.json 配置、成员管理、模板变量 |
| 03 | [03-auto-approve-setup.md](./03-auto-approve-setup.md) | 自动免确认机制 | 双层免确认：Golutra 层 + Claude 层 |
| 04 | [04-agents-md-guide.md](./04-agents-md-guide.md) | AGENTS.md 编写指南 | AI Agent 行为契约的编写规范 |
| 05 | [05-pack-development.md](./05-pack-development.md) | 自定义 Pack 开发 | Pack 结构、配置文件、Hello World 示例 |
| 06 | [06-bundle-composition.md](./06-bundle-composition.md) | Bundle 工作流组合 | bundle.json 编写、多 Pack 管道编排 |
| 07 | [07-orchestrator-design.md](./07-orchestrator-design.md) | Orchestrator 编排设计 | 状态机、蓝图、记忆契约 |
| 08 | [08-memory-bus.md](./08-memory-bus.md) | Memory Bus 跨 Pack 通信 | 事件 schema、发布/消费模式 |
| 09 | [09-hook-system.md](./09-hook-system.md) | Hook 治理系统 | before/after 钩子、自定义 handler |
| 10 | [10-scheduled-tasks.md](./10-scheduled-tasks.md) | 定时任务与自动调度 | 调度配置、daily/interval/once 模式 |
| 11 | [11-best-practices.md](./11-best-practices.md) | 最佳实践与常见坑 | 命名规范、安全、扩展性 |

## 适用人群

- 想用 AI Agent 自动化工作流的开发者
- 需要管理多 Agent 协作的团队
- 对 PSEO、SEO 自动化感兴趣的从业者

## 前置要求

- 基本的命令行操作能力
- Node.js 18+ 环境
- Git 基础操作
- 对 AI Agent 概念有初步了解

## 约定

- 所有路径以项目根目录为基准
- 命令示例默认在 bash/zsh 下执行
- Windows 用户建议使用 WSL2 或 Git Bash
- `$ROOT` 代表项目根目录

## 贡献

发现错误或有改进建议？欢迎提 Issue 或 PR。
