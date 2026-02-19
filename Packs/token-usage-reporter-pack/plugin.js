/**
 * Token Usage Reporter Plugin
 * 
 * Tracks token usage across OpenClaw sessions and generates reports.
 * Hooks into after_tool_call and session_end events.
 */

import { join } from "node:path";
import { existsSync, mkdirSync, appendFileSync, writeFileSync, readFileSync } from "node:fs";

const PLUGIN_ID = "token-usage-reporter";

function getPaths(root) {
  const base = root || join(process.env.HOME || process.env.USERPROFILE || ".", ".openclaw");
  return {
    logsDir: join(base, "logs"),
    reportsDir: join(base, "reports"),
    eventsFile: join(base, "logs", "token-usage.jsonl"),
    reportFile: join(base, "reports", "token-usage-latest.json"),
  };
}

function ensureDirs(paths) {
  if (!existsSync(paths.logsDir)) {
    mkdirSync(paths.logsDir, { recursive: true });
  }
  if (!existsSync(paths.reportsDir)) {
    mkdirSync(paths.reportsDir, { recursive: true });
  }
}

function readJsonl(filePath) {
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, "utf-8");
  return content
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function writeJson(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function appendJsonl(filePath, data) {
  appendFileSync(filePath, JSON.stringify(data) + "\n");
}

function pickUsage(payload) {
  const usage = payload?.usage || payload?.meta?.usage || {};
  const input = usage.input_tokens || usage.inputTokens || usage.prompt_tokens || 0;
  const output = usage.output_tokens || usage.outputTokens || usage.completion_tokens || 0;
  const total = usage.total_tokens || input + output || 0;
  
  return {
    input_tokens: input,
    output_tokens: output,
    total_tokens: total,
    estimated: !usage.input_tokens && !usage.prompt_tokens,
  };
}

export default {
  id: PLUGIN_ID,
  name: "Token Usage Reporter",
  description: "Tracks token usage across sessions and generates reports",
  version: "1.0.0",
  
  typedHooks: [
    {
      hookName: "after_tool_call",
      priority: 100,
      handler: async (event, ctx) => {
        const paths = getPaths(ctx?.workspaceDir);
        ensureDirs(paths);
        
        const evt = {
          ts: new Date().toISOString(),
          session_id: ctx?.sessionKey || "unknown",
          task_id: event?.toolCallId || "unknown",
          source: event?.toolName || "tool",
          model: "unknown", // Runtime doesn't provide this yet
          usage: pickUsage(event),
        };
        
        appendJsonl(paths.eventsFile, evt);
      },
    },
    {
      hookName: "session_end",
      priority: 100,
      handler: async (event, ctx) => {
        const paths = getPaths(ctx?.workspaceDir);
        ensureDirs(paths);
        
        const sessionId = ctx?.sessionKey || "unknown";
        const rows = readJsonl(paths.eventsFile).filter(
          (r) => r.session_id === sessionId
        );
        
        const report = {
          ts: new Date().toISOString(),
          session_id: sessionId,
          task_id: event?.taskId || "unknown",
          events: rows.length,
          usage_total: rows.reduce(
            (acc, r) => {
              acc.input_tokens += r?.usage?.input_tokens || 0;
              acc.output_tokens += r?.usage?.output_tokens || 0;
              acc.total_tokens += r?.usage?.total_tokens || 0;
              acc.estimated_events += r?.usage?.estimated ? 1 : 0;
              return acc;
            },
            { input_tokens: 0, output_tokens: 0, total_tokens: 0, estimated_events: 0 }
          ),
          by_model: Object.values(
            rows.reduce((m, r) => {
              const k = r.model || "unknown";
              if (!m[k]) m[k] = { model: k, total_tokens: 0, events: 0 };
              m[k].total_tokens += r?.usage?.total_tokens || 0;
              m[k].events += 1;
              return m;
            }, {})
          ).sort((a, b) => b.total_tokens - a.total_tokens),
        };
        
        writeJson(paths.reportFile, report);
        
        // Log summary to stderr for visibility
        const summary = `
📊 Token Usage Summary
- Session: ${sessionId}
- Events: ${report.events}
- Total: ${report.usage_total.total_tokens.toLocaleString()} tokens
- Input: ${report.usage_total.input_tokens.toLocaleString()}
- Output: ${report.usage_total.output_tokens.toLocaleString()}
${report.usage_total.estimated_events > 0 ? `- Note: ${report.usage_total.estimated_events} events estimated (no usage data from provider)` : ''}`;
        
        console.error(summary);
      },
    },
  ],
};
