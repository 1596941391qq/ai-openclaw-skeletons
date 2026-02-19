import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function readPayload() {
  try {
    if (process.argv[2]) return JSON.parse(process.argv[2]);
  } catch {}
  try {
    const chunks = [];
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      return new Promise((resolve) => {
        stdin.on("data", (d) => chunks.push(d));
        stdin.on("end", () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
          } catch {
            resolve({});
          }
        });
      });
    }
  } catch {}
  return {};
}

export function pickUsage(payload) {
  const cand = [
    payload?.usage,
    payload?.result?.usage,
    payload?.response?.usage,
    payload?.meta?.usage
  ].find(Boolean);

  if (cand) {
    const input = Number(cand.prompt_tokens ?? cand.input_tokens ?? 0);
    const output = Number(cand.completion_tokens ?? cand.output_tokens ?? 0);
    const total = Number(cand.total_tokens ?? input + output);
    return { input_tokens: input, output_tokens: output, total_tokens: total, estimated: false };
  }

  const sourceText = JSON.stringify(payload?.result ?? payload ?? "");
  const approx = Math.ceil(sourceText.length / 4);
  return { input_tokens: 0, output_tokens: approx, total_tokens: approx, estimated: true };
}

export function appendJsonl(path, row) {
  ensureDir(dirname(path));
  appendFileSync(path, `${JSON.stringify(row)}\n`, "utf8");
}

export function readJsonl(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    })
    .filter(Boolean);
}

export function writeJson(path, obj) {
  ensureDir(dirname(path));
  writeFileSync(path, `${JSON.stringify(obj, null, 2)}\n`, "utf8");
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function paths(homeDir) {
  return {
    events: join(homeDir, "logs", "token-usage.jsonl"),
    latestReport: join(homeDir, "reports", "token-usage-latest.json")
  };
}