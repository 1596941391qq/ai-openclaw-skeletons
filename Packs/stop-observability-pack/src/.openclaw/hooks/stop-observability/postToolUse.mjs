import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";

function getBaseDir(root) {
  return root || join(process.env.HOME || process.env.USERPROFILE || ".", ".openclaw");
}

function ensureDirs(baseDir) {
  const dirs = [
    join(baseDir, "logs"),
    join(baseDir, "reports"),
    join(baseDir, ".sop", "traces"),
    join(baseDir, "stop"),
  ];
  for (const dir of dirs) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
}

function appendJsonl(filePath, row) {
  appendFileSync(filePath, `${JSON.stringify(row)}\n`);
}

function loadManifest(baseDir) {
  const file = join(baseDir, "stop", "agent-team.skill.json");
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function pickOutput(event) {
  return event?.result ?? event?.output ?? event?.meta?.result ?? {};
}

function runPostAssertions(manifest, event, toolName, output, durationMs) {
  const rules = Array.isArray(manifest?.assertions?.post) ? manifest.assertions.post : [];
  return rules.map((rule) => {
    const severity = rule?.severity || "warn";
    const base = {
      check: rule?.check || "unknown",
      severity,
      status: "pass",
    };

    if (rule?.check === "tool_success") {
      return event?.error
        ? { ...base, status: "fail", message: rule?.message || "tool call failed" }
        : base;
    }

    if (rule?.check === "tool_called") {
      return rule?.tool && rule.tool !== toolName
        ? { ...base, status: "fail", message: rule?.message || `tool mismatch: ${rule.tool}` }
        : base;
    }

    if (typeof rule?.check === "string" && rule.check.startsWith("output.")) {
      const key = rule.check.slice("output.".length);
      const val = output?.[key];
      if (rule?.not_empty && (val === null || val === undefined || val === "")) {
        return { ...base, status: "fail", message: rule?.message || `output.${key} is empty` };
      }
      if (rule?.matches) {
        const re = new RegExp(rule.matches);
        if (!re.test(String(val ?? ""))) {
          return { ...base, status: "fail", message: rule?.message || `output.${key} not matched` };
        }
      }
      if (rule?.greater_than !== undefined) {
        if (typeof val !== "number" || val <= rule.greater_than) {
          return {
            ...base,
            status: "fail",
            message: rule?.message || `output.${key} must > ${rule.greater_than}`,
          };
        }
      }
      return { ...base, value: val };
    }

    if (rule?.check === "duration") {
      if (rule?.max_ms !== undefined && durationMs > rule.max_ms) {
        return {
          ...base,
          status: "fail",
          message: rule?.message || `duration ${durationMs}ms exceeds ${rule.max_ms}ms`,
        };
      }
      return { ...base, value: durationMs };
    }

    return { ...base, status: "fail", message: rule?.message || `unknown check ${rule?.check}` };
  });
}

export default async function postToolUse(event, ctx) {
  const baseDir = getBaseDir(ctx?.workspaceDir);
  ensureDirs(baseDir);

  const sessionId = ctx?.sessionKey || "unknown";
  const toolName = event?.toolName || event?.name || "unknown_tool";
  const role =
    event?.meta?.role ||
    event?.context?.role ||
    event?.role ||
    "executor";
  const delegatedTo =
    event?.meta?.delegated_to ||
    event?.context?.delegated_to ||
    null;

  const now = new Date();
  const startAt = event?.startedAt ? new Date(event.startedAt) : now;
  const durationMs = Number(event?.duration_ms || event?.meta?.duration_ms || now - startAt);
  const status = event?.error ? "error" : "ok";

  const span = {
    span_id: `s_${crypto.randomBytes(6).toString("hex")}`,
    trace_id: `t_${sessionId}`,
    parent_span_id: event?.parentSpanId || null,
    start_time: startAt.toISOString(),
    end_time: now.toISOString(),
    duration_ms: durationMs,
    kind: "tool.call",
    name: toolName,
    status,
    attributes: {
      "session.id": sessionId,
      "task.id": event?.toolCallId || "unknown",
      "agent.role": role,
      "agent.delegated_to": delegatedTo,
      "tool.name": toolName,
    },
    error: event?.error
      ? {
          type: event?.error?.name || "ToolError",
          message: event?.error?.message || String(event.error),
        }
      : undefined,
  };

  const spansFile = join(baseDir, "logs", "stop-spans.jsonl");
  appendJsonl(spansFile, span);

  const manifest = loadManifest(baseDir);
  const output = pickOutput(event);
  const assertionResults = runPostAssertions(manifest, event, toolName, output, durationMs);
  const assertFile = join(baseDir, "logs", "stop-assertions.jsonl");

  for (const result of assertionResults) {
    appendJsonl(assertFile, {
      ts: now.toISOString(),
      session_id: sessionId,
      task_id: event?.toolCallId || "unknown",
      tool: toolName,
      role,
      result,
    });
  }
}
