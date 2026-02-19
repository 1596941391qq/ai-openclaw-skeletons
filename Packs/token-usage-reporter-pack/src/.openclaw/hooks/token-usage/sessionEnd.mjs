import { join } from "node:path";
import { paths, readPayload, readJsonl, writeJson } from "./shared.mjs";

const maybePromise = readPayload();
const payload = typeof maybePromise?.then === "function" ? await maybePromise : maybePromise;
const root = process.env.OPENCLAW_HOME || join(process.env.HOME || process.env.USERPROFILE || ".", ".openclaw");
const p = paths(root);

const sessionId = String(payload?.session_id ?? payload?.sessionId ?? "unknown-session");
const taskId = String(payload?.task_id ?? payload?.taskId ?? "unknown-task");
const rows = readJsonl(p.events).filter((r) => String(r.session_id) === sessionId);

const report = {
  ts: new Date().toISOString(),
  session_id: sessionId,
  task_id: taskId,
  events: rows.length,
  usage_total: rows.reduce(
    (acc, r) => {
      acc.input_tokens += Number(r?.usage?.input_tokens ?? 0);
      acc.output_tokens += Number(r?.usage?.output_tokens ?? 0);
      acc.total_tokens += Number(r?.usage?.total_tokens ?? 0);
      acc.estimated_events += r?.usage?.estimated ? 1 : 0;
      return acc;
    },
    { input_tokens: 0, output_tokens: 0, total_tokens: 0, estimated_events: 0 }
  ),
  by_model: Object.values(
    rows.reduce((m, r) => {
      const k = String(r.model ?? "unknown");
      if (!m[k]) m[k] = { model: k, total_tokens: 0, events: 0 };
      m[k].total_tokens += Number(r?.usage?.total_tokens ?? 0);
      m[k].events += 1;
      return m;
    }, {})
  ).sort((a, b) => b.total_tokens - a.total_tokens)
};

writeJson(p.latestReport, report);
console.log(JSON.stringify({ ok: true, token_report: report }, null, 2));