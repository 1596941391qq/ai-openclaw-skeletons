# 05 — 自定义 Pack 开发

> 📹 [视频教程待录] — 本篇对应视频录制后将在此更新链接

## 你将学到

- Pack 的定义与设计哲学
- 标准目录结构
- `pack.openclaw.json` 配置详解
- 从零开发一个 Hello World Pack

## 前置条件

- 完成 [04-agents-md-guide.md](./04-agents-md-guide.md)
- 熟悉命令行脚本编写
- 理解"库优先"原则（Article I）

## 核心概念

Pack 是 OpenClaw 的最小可复用能力单元。每个 Pack：

- 封装一个独立能力（发布、挖词、同步...）
- 通过 CLI 暴露接口（文本输入，JSON 输出）
- 可被 Bundle 组合调用
- 遵循 Article I（库优先）和 Article II（CLI 接口）

> 📸 截图：[Pack 在整体架构中的位置]

## 标准目录结构

```
Packs/
└── my-pack/
    ├── pack.openclaw.json    # Pack 元数据与配置
    ├── cil/                  # CLI 入口脚本
    │   ├── main-command.ps1  # 主命令
    │   └── sub-command.ps1   # 子命令
    ├── lib/                  # 核心库代码
    │   ├── index.ts          # 库入口
    │   └── utils.ts          # 工具函数
    ├── tests/                # 测试
    │   └── main.test.ts
    └── README.md             # Pack 文档
```

## 步骤

### 1. 创建 Pack 骨架

```bash
mkdir -p Packs/hello-world-pack/{cil,lib,tests}
```

### 2. 编写 pack.openclaw.json

```json
{
  "name": "hello-world-pack",
  "version": "0.1.0",
  "description": "示例 Pack：接收名字，返回问候",
  "author": "your-team",
  "entry": "cil/greet.ps1",
  "inputs": {
    "name": {
      "type": "string",
      "required": true,
      "description": "要问候的名字"
    },
    "language": {
      "type": "string",
      "default": "zh",
      "enum": ["zh", "en", "ja"],
      "description": "问候语言"
    }
  },
  "outputs": {
    "type": "json",
    "schema": {
      "greeting": "string",
      "timestamp": "string"
    }
  },
  "dependencies": [],
  "tags": ["example", "starter"]
}
```

### 3. 编写核心库

```typescript
// Packs/hello-world-pack/lib/index.ts

interface GreetOptions {
  name: string;
  language: 'zh' | 'en' | 'ja';
}

interface GreetResult {
  greeting: string;
  timestamp: string;
}

export function greet(options: GreetOptions): GreetResult {
  const greetings = {
    zh: `你好，${options.name}！欢迎使用 OpenClaw。`,
    en: `Hello, ${options.name}! Welcome to OpenClaw.`,
    ja: `こんにちは、${options.name}！OpenClawへようこそ。`
  };

  return {
    greeting: greetings[options.language],
    timestamp: new Date().toISOString()
  };
}
```

### 4. 编写 CLI 入口

```bash
#!/bin/bash
# Packs/hello-world-pack/cil/greet.ps1

NAME="${1:?用法: greet.ps1 <name> [language]}"
LANG="${2:-zh}"

# 调用库函数并输出 JSON
bun run --eval "
  const { greet } = require('./lib/index.ts');
  const result = greet({ name: '$NAME', language: '$LANG' });
  console.log(JSON.stringify(result, null, 2));
"
```

### 5. 编写测试

```typescript
// Packs/hello-world-pack/tests/main.test.ts
import { describe, it, expect } from 'bun:test';
import { greet } from '../lib/index';

describe('hello-world-pack', () => {
  it('应该返回中文问候', () => {
    const result = greet({ name: '世界', language: 'zh' });
    expect(result.greeting).toContain('你好');
    expect(result.greeting).toContain('世界');
  });

  it('应该返回英文问候', () => {
    const result = greet({ name: 'World', language: 'en' });
    expect(result.greeting).toContain('Hello');
  });

  it('应该包含时间戳', () => {
    const result = greet({ name: 'Test', language: 'zh' });
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});
```

### 6. 运行验证

```bash
cd Packs/hello-world-pack
bun test
# 预期输出：3 tests passed

bash cil/greet.ps1 "OpenClaw" zh
# 预期输出：{"greeting":"你好，OpenClaw！...","timestamp":"..."}
```

> 📸 截图：[测试通过和 CLI 输出的终端截图]

## 验证

- [ ] `pack.openclaw.json` 格式正确
- [ ] 库代码可独立导入使用
- [ ] CLI 入口接受参数并输出 JSON
- [ ] 测试全部通过
- [ ] 无外部依赖或依赖已声明

## 常见问题

**Q: Pack 和普通脚本有什么区别？**
A: Pack 有标准化的输入/输出契约（pack.openclaw.json），可被 Bundle 自动编排。

**Q: 一个 Pack 可以有多个 CLI 命令吗？**
A: 可以。在 `cil/` 目录下放多个脚本，`entry` 指向主命令。

**Q: Pack 之间可以互相调用吗？**
A: 不建议直接调用。通过 Bundle 编排或 Memory Bus 通信。

## 下一步

单个 Pack 开发完成，接下来学习如何用 Bundle 组合多个 Pack → [06-bundle-composition.md](./06-bundle-composition.md)
