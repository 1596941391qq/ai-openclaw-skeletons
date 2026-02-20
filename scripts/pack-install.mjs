import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

const packName = process.argv[2];
if (!packName) {
  console.error("usage: node scripts/pack-install.mjs <pack-name> [--target <path>]");
  process.exit(1);
}

const args = process.argv.slice(3);
let target = join(os.homedir(), ".openclaw");
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--target") target = args[i + 1];
}

const packRoot = join(process.cwd(), "Packs", packName);
const openclawSrc = join(packRoot, "src", ".openclaw");
const packCfgPath = join(packRoot, "pack.openclaw.json");
const baselinePath = join(process.cwd(), "templates", ".openclaw", "openclaw.json");
const targetCfgPath = join(target, "openclaw.json");

if (!existsSync(packRoot)) throw new Error(`pack not found: ${packName}`);
if (!existsSync(packCfgPath)) throw new Error(`missing ${packName}/pack.openclaw.json`);

mkdirSync(target, { recursive: true });
if (!existsSync(targetCfgPath)) {
  writeFileSync(targetCfgPath, readFileSync(baselinePath, "utf8"), "utf8");
}

const cfg = JSON.parse(readFileSync(targetCfgPath, "utf8"));
const patch = JSON.parse(readFileSync(packCfgPath, "utf8"));
const unique = (arr) => Array.from(new Set(arr));

cfg.tools = cfg.tools ?? { allow: [], deny: [] };
cfg.tools.allow = unique([...(cfg.tools.allow ?? []), ...(patch.tools?.allow ?? [])]);
cfg.tools.deny = unique([...(cfg.tools.deny ?? []), ...(patch.tools?.deny ?? [])]);

cfg.mcpServers = { ...(cfg.mcpServers ?? {}), ...(patch.mcpServers ?? {}) };
cfg.skills = { ...(cfg.skills ?? {}), ...(patch.skills ?? {}) };

cfg.plugins = cfg.plugins ?? { entries: {} };
cfg.plugins.entries = { ...(cfg.plugins.entries ?? {}), ...(patch.plugins?.entries ?? {}) };

cfg.hooks = cfg.hooks ?? {};
cfg.hooks.internal = cfg.hooks.internal ?? {
  enabled: true,
  load: { extraDirs: [] },
  entries: {},
  handlers: []
};
if (typeof patch.hooks?.internal?.enabled === "boolean") {
  cfg.hooks.internal.enabled = patch.hooks.internal.enabled;
}

const prevExtraDirs = Array.isArray(cfg.hooks.internal.load?.extraDirs)
  ? cfg.hooks.internal.load.extraDirs
  : [];
const nextExtraDirs = Array.isArray(patch.hooks?.internal?.load?.extraDirs)
  ? patch.hooks.internal.load.extraDirs
  : [];
cfg.hooks.internal.load = { extraDirs: unique([...prevExtraDirs, ...nextExtraDirs]) };

cfg.hooks.internal.entries = {
  ...(cfg.hooks.internal.entries ?? {}),
  ...(patch.hooks?.internal?.entries ?? {})
};

const prevHandlers = Array.isArray(cfg.hooks.internal.handlers) ? cfg.hooks.internal.handlers : [];
const nextHandlers = Array.isArray(patch.hooks?.internal?.handlers)
  ? patch.hooks.internal.handlers
  : [];
const handlersByKey = new Map();
for (const h of [...prevHandlers, ...nextHandlers]) {
  if (!h?.event || !h?.module) continue;
  handlersByKey.set(`${h.event}::${h.module}`, h);
}
cfg.hooks.internal.handlers = Array.from(handlersByKey.values());

const prevContext = Array.isArray(cfg.contextFiles) ? cfg.contextFiles : [];
const nextContext = Array.isArray(patch.contextFiles) ? patch.contextFiles : [];
cfg.contextFiles = unique([...prevContext, ...nextContext]);

const prevSchedules = Array.isArray(cfg.schedules) ? cfg.schedules : [];
const nextSchedules = Array.isArray(patch.schedules) ? patch.schedules : [];
const scheduleMap = new Map(prevSchedules.map((j) => [j.job_id, j]));
for (const job of nextSchedules) {
  if (job?.job_id) scheduleMap.set(job.job_id, { ...(scheduleMap.get(job.job_id) ?? {}), ...job });
}
cfg.schedules = Array.from(scheduleMap.values());

writeFileSync(targetCfgPath, `${JSON.stringify(cfg, null, 2)}\n`, "utf8");

if (existsSync(openclawSrc)) {
  cpSync(openclawSrc, target, { recursive: true, force: true });
}

console.log(`[pack-install] installed ${packName} to ${target}`);
