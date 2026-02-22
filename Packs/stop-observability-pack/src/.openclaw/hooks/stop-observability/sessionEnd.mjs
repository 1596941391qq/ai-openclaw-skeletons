import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function getBaseDir(root) {
  return root || join(process.env.HOME || process.env.USERPROFILE || ".", ".openclaw");
}

function ensureDirs(baseDir) {
  const dirs = [
    join(baseDir, "logs"),
    join(baseDir, "reports"),
    join(baseDir, ".sop", "traces"),
  ];
  for (const dir of dirs) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
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

function toCounter(rows, key) {
  return Object.values(
    rows.reduce((acc, row) => {
      const name = row?.[key] || "unknown";
      if (!acc[name]) acc[name] = { [key]: name, count: 0 };
      acc[name].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);
}

export default async function sessionEnd(event, ctx) {
  const baseDir = getBaseDir(ctx?.workspaceDir);
  ensureDirs(baseDir);

  const sessionId = ctx?.sessionKey || "unknown";
  const spansFile = join(baseDir, "logs", "stop-spans.jsonl");
  const assertFile = join(baseDir, "logs", "stop-assertions.jsonl");
  const traceDir = join(baseDir, ".sop", "traces");

  const spans = readJsonl(spansFile).filter((row) => row?.attributes?.["session.id"] === sessionId);
  const assertions = readJsonl(assertFile).filter((row) => row?.session_id === sessionId);

  const ts = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15) + "Z";
  const tracePath = join(traceDir, `${ts}_${sessionId}.jsonl`);
  for (const span of spans) {
    appendFileSync(tracePath, `${JSON.stringify(span)}\n`);
  }

  const summary = {
    ts: new Date().toISOString(),
    session_id: sessionId,
    task_id: event?.taskId || "unknown",
    spans: spans.length,
    by_tool: toCounter(
      spans.map((span) => ({ tool: span?.attributes?.["tool.name"] || "unknown" })),
      "tool"
    ),
    by_role: toCounter(
      spans.map((span) => ({ role: span?.attributes?.["agent.role"] || "unknown" })),
      "role"
    ),
    by_status: toCounter(spans.map((span) => ({ status: span?.status || "unknown" })), "status"),
    assertions: {
      total: assertions.length,
      passed: assertions.filter((row) => row?.result?.status === "pass").length,
      failed: assertions.filter((row) => row?.result?.status === "fail").length,
    },
    trace_file: tracePath,
  };

  const reportFile = join(baseDir, "reports", "stop-latest-report.json");
  writeFileSync(reportFile, `${JSON.stringify(summary, null, 2)}\n`);

  const summaryText = [
    "",
    "[STOP] Session Observability Summary",
    `- Session: ${sessionId}`,
    `- Spans: ${summary.spans}`,
    `- Assertions: ${summary.assertions.passed} passed / ${summary.assertions.failed} failed`,
    `- Trace: ${tracePath}`,
    `- Report: ${reportFile}`,
  ].join("\n");

  console.error(summaryText);
}
