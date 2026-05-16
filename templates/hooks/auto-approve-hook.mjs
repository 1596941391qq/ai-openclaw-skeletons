/**
 * Auto-Approve Hook Handler
 *
 * hook-executor-pack 的最小实现示例。
 * 在 Agent 执行前自动审批低风险操作，减少人工确认次数。
 *
 * 配置方式：在 openclaw.json 的 hooks.internal.handlers 中注册：
 * {
 *   "event": "before:tool_call",
 *   "handler": "./hooks/auto-approve-hook.mjs",
 *   "config": { "allowList": ["Read", "Glob", "Grep", "WebSearch"] }
 * }
 */

const DEFAULT_ALLOW_LIST = [
  'Read', 'Glob', 'Grep', 'LS',
  'WebFetch', 'WebSearch',
  'NotebookRead',
  'TaskList', 'TaskGet',
  'CronList'
];

const ALWAYS_ASK = [
  'Bash(rm ', 'Bash(git push --force', 'Bash(git reset --hard',
  'Bash(DROP ', 'Bash(DELETE FROM'
];

export default function autoApproveHook(event, context) {
  const { toolName, toolInput } = event;
  const allowList = context.config?.allowList || DEFAULT_ALLOW_LIST;

  if (allowList.includes(toolName)) {
    return { action: 'approve', reason: `${toolName} is in allow list` };
  }

  const inputStr = JSON.stringify(toolInput || {});
  for (const pattern of ALWAYS_ASK) {
    if (`${toolName}(${inputStr})`.includes(pattern)) {
      return { action: 'ask', reason: `Destructive pattern detected: ${pattern}` };
    }
  }

  if (toolName === 'Edit' || toolName === 'Write') {
    return { action: 'approve', reason: 'File edits auto-approved in dev mode' };
  }

  if (toolName === 'Bash') {
    const cmd = toolInput?.command || '';
    if (cmd.startsWith('git status') || cmd.startsWith('git log') || cmd.startsWith('git diff')) {
      return { action: 'approve', reason: 'Read-only git command' };
    }
  }

  return { action: 'pass' };
}
