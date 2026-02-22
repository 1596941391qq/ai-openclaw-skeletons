import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
    join(baseDir, "otel", "traces"),
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

function pickUsage(event) {
  const usage = event?.usage || event?.meta?.usage || {};
  const input = Number(usage?.input_tokens || usage?.inputTokens || usage?.prompt_tokens || 0);
  const output = Number(usage?.output_tokens || usage?.outputTokens || usage?.completion_tokens || 0);
  const total = Number(usage?.total_tokens || input + output || 0);
  const costUsd = Number(usage?.cost_usd || usage?.estimated_cost_usd || event?.meta?.cost_usd || 0);
  return {
    input_tokens: input,
    output_tokens: output,
    total_tokens: total,
    cost_usd: costUsd,
  };
}

function isMcpCall(event, toolName) {
  const protocol = event?.meta?.protocol || event?.context?.protocol || "";
  if (String(protocol).toLowerCase() === "mcp") return true;
  return String(toolName).toLowerCase().includes("mcp");
}

function mapOtelStatus(status) {
  return status === "ok" ? "OK" : "ERROR";
}

function readJsonl(filePath) {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function resolveBudget(manifest) {
  return {
    max_tool_calls: Number(manifest?.governance?.budget?.max_tool_calls ?? 80),
    max_errors: Number(manifest?.governance?.budget?.max_errors ?? 10),
    max_total_duration_ms: Number(manifest?.governance?.budget?.max_total_duration_ms ?? 900000),
    max_total_tokens: Number(manifest?.governance?.budget?.max_total_tokens ?? 300000),
    max_total_cost_usd: Number(manifest?.governance?.budget?.max_total_cost_usd ?? 5),
  };
}

function evaluateBudget(spans, budget) {
  const totals = spans.reduce(
    (acc, row) => {
      acc.calls += 1;
      acc.errors += row?.status === "error" ? 1 : 0;
      acc.duration_ms += Number(row?.duration_ms || 0);
      acc.total_tokens += Number(row?.attributes?.["usage.total_tokens"] || 0);
      acc.total_cost_usd += Number(row?.attributes?.["usage.cost_usd"] || 0);
      return acc;
    },
    { calls: 0, errors: 0, duration_ms: 0, total_tokens: 0, total_cost_usd: 0 }
  );

  const breaches = [];
  if (totals.calls > budget.max_tool_calls) breaches.push("max_tool_calls");
  if (totals.errors > budget.max_errors) breaches.push("max_errors");
  if (totals.duration_ms > budget.max_total_duration_ms) breaches.push("max_total_duration_ms");
  if (totals.total_tokens > budget.max_total_tokens) breaches.push("max_total_tokens");
  if (totals.total_cost_usd > budget.max_total_cost_usd) breaches.push("max_total_cost_usd");

  return {
    totals,
    breaches,
    halted: breaches.length > 0,
    action: breaches.length > 0 ? "recommend_halt" : "continue",
  };
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
  const usage = pickUsage(event);
  const mcp = isMcpCall(event, toolName);

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
      "tool.protocol": mcp ? "mcp" : "native",
      "usage.input_tokens": usage.input_tokens,
      "usage.output_tokens": usage.output_tokens,
      "usage.total_tokens": usage.total_tokens,
      "usage.cost_usd": usage.cost_usd,
    },
    otel: {
      trace_id: `t_${sessionId}`,
      span_id: event?.toolCallId || `s_${crypto.randomBytes(4).toString("hex")}`,
      parent_span_id: event?.parentSpanId || null,
      name: `tool.call:${toolName}`,
      kind: "INTERNAL",
      status_code: mapOtelStatus(status),
      attributes: {
        "gen_ai.operation.name": mcp ? "mcp.tool.call" : "tool.call",
        "gen_ai.tool.name": toolName,
        "gen_ai.agent.role": role,
        "gen_ai.usage.input_tokens": usage.input_tokens,
        "gen_ai.usage.output_tokens": usage.output_tokens,
      },
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
  appendJsonl(join(baseDir, "otel", "traces", "stop-otel-spans.jsonl"), span.otel);
  if (mcp) {
    appendJsonl(join(baseDir, "logs", "stop-mcp-spans.jsonl"), span);
  }

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

  const allSessionSpans = readJsonl(spansFile).filter(
    (row) => row?.attributes?.["session.id"] === sessionId
  );
  const budget = resolveBudget(manifest);
  const gate = evaluateBudget(allSessionSpans, budget);
  const guardEvent = {
    ts: now.toISOString(),
    session_id: sessionId,
    task_id: event?.toolCallId || "unknown",
    policy: {
      name: "session_budget_guard",
      budget,
    },
    evaluation: gate,
  };
  appendJsonl(join(baseDir, "logs", "stop-guard-events.jsonl"), guardEvent);
  writeFileSync(
    join(baseDir, "reports", "stop-guard-latest.json"),
    `${JSON.stringify(guardEvent, null, 2)}\n`,
    "utf8"
  );
}
