# 06 — Bundle 工作流组合

> 📹 [视频教程待录] — 本篇对应视频录制后将在此更新链接

## 你将学到

- Bundle 的定位：多 Pack 管道编排
- `bundle.json` 的完整结构
- 数据在 Pack 之间的流转方式
- 条件分支与错误处理

## 前置条件

- 完成 [05-pack-development.md](./05-pack-development.md)
- 至少有两个可用的 Pack
- 理解管道（pipeline）概念

## 核心概念

Bundle 是 Pack 的编排层。如果 Pack 是函数，Bundle 就是调用链：

```
Pack A (挖词) → Pack B (评分) → Pack C (发布)
```

Bundle 定义了：
- 执行顺序
- 数据传递规则
- 条件分支
- 失败回退策略

> 📸 截图：[Bundle 管道流程图]

## bundle.json 结构

```json
{
  "name": "pseo-publish-pipeline",
  "version": "1.0.0",
  "description": "从挖词到发布的完整管道",
  "trigger": "manual",
  "pipeline": [
    {
      "step": "mine-keywords",
      "pack": "nichedigger-pack",
      "command": "run-nichedigger.ps1",
      "inputs": {
        "brand": "{{context.brand}}",
        "seedFile": "{{context.seedFile}}"
      },
      "outputs": {
        "keywords": "$.result.keywords"
      }
    },
    {
      "step": "score-and-filter",
      "pack": "keyword-scorer-pack",
      "command": "score.ps1",
      "inputs": {
        "keywords": "{{steps.mine-keywords.outputs.keywords}}"
      },
      "condition": "{{steps.mine-keywords.outputs.keywords.length > 0}}",
      "outputs": {
        "approved": "$.result.approved"
      }
    },
    {
      "step": "publish",
      "pack": "gh-pages-publisher-pack",
      "command": "publish-gh-pages-unifuncs.ps1",
      "inputs": {
        "articles": "{{steps.score-and-filter.outputs.approved}}"
      },
      "onError": "skip-and-log"
    }
  ],
  "context": {
    "brand": "",
    "seedFile": ""
  }
}
```

## 步骤

### 1. 创建 Bundle 目录

```bash
mkdir -p Bundles/my-pipeline
```

### 2. 定义管道步骤

设计你的数据流：

```
输入 → [Pack A] → 中间产物 → [Pack B] → 最终产物
```

关键决策：
- 每步的输入从哪来？（context / 上一步输出）
- 每步的输出存到哪？（变量名）
- 失败了怎么办？（retry / skip / abort）

### 3. 数据引用语法

Bundle 使用模板语法引用数据：

```json
{
  "{{context.brand}}": "从 Bundle 启动参数获取",
  "{{steps.step-name.outputs.field}}": "从前序步骤输出获取",
  "{{env.API_KEY}}": "从环境变量获取"
}
```

### 4. 条件执行

```json
{
  "step": "optional-step",
  "condition": "{{steps.prev.outputs.count > 10}}",
  "pack": "some-pack",
  "command": "process.ps1"
}
```

条件为 false 时，该步骤被跳过，后续步骤继续执行。

### 5. 错误处理策略

```json
{
  "onError": "abort",
  "onError": "skip-and-log",
  "onError": "retry",
  "retryConfig": {
    "maxRetries": 3,
    "backoffMs": 1000
  }
}
```

### 6. 运行 Bundle

```bash
# 通过 CLI 运行
cd Bundles/my-pipeline
bash run.sh --brand "302ai" --seedFile "seeds.txt"

# 或通过 Orchestrator 调度
# （见下一篇教程）
```

> 📸 截图：[Bundle 执行过程的终端输出，显示每步状态]

### 7. 实战示例：PSEO Bundle

```bash
# 查看现有 PSEO Bundle
cat Bundles/PSEO/bundle.json
```

这个 Bundle 组合了挖词、发布、回写三个 Pack，是生产环境的真实案例。

## 验证

- [ ] `bundle.json` 格式正确且可解析
- [ ] 每个 step 引用的 Pack 存在
- [ ] 数据引用路径正确（无 undefined）
- [ ] 条件分支逻辑符合预期
- [ ] 错误处理策略已定义

## 常见问题

**Q: Bundle 和 Shell 脚本串联有什么区别？**
A: Bundle 有声明式的数据流、条件分支、错误处理和可观测性。Shell 脚本是命令式的黑盒。

**Q: 步骤之间可以并行吗？**
A: 当前版本是串行执行。并行需要在 Orchestrator 层实现。

**Q: 一个 Bundle 最多几个步骤？**
A: 没有硬限制，但建议不超过 7 步。太长的管道应该拆成多个 Bundle。

**Q: 如何调试中间步骤？**
A: 使用 `--dry-run` 模式查看每步的输入输出，或单独运行某个 Pack。

## 下一步

Bundle 解决了线性管道，更复杂的编排需要 Orchestrator → [07-orchestrator-design.md](./07-orchestrator-design.md)
