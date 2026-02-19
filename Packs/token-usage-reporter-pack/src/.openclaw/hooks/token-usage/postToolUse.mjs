import { join } from "node:path";
import { paths, readPayload, pickUsage, appendJsonl } from "./shared.mjs";

const maybePromise = readPayload();
const payload = typeof maybePromise?.then === "function" ? await maybePromise : maybePromise;
const root = process.env.OPENCLAW_HOME || join(process.env.HOME || process.env.USERPROFILE || ".", ".openclaw");
const p = paths(root);

const evt = {
  ts: new Date().toISOString(),
  session_id: String(payload?.session_id ?? payload?.sessionId ?? "unknown-session"),
  task_id: String(payload?.task_id ?? payload?.taskId ?? "unknown-task"),
  source: String(payload?.tool ?? payload?.source ?? "post-tool-use"),
  model: String(payload?.model ?? payload?.meta?.model ?? "unknown"),
  usage: pickUsage(payload)
};

appendJsonl(p.events, evt);
console.log(JSON.stringify({ ok: true, token_event: evt }, null, 2));