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
const skillSrc = join(packRoot, "src", ".openclaw", "skills");
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

cfg.tools.allow = unique([...(cfg.tools.allow ?? []), ...(patch.tools?.allow ?? [])]);
cfg.tools.deny = unique([...(cfg.tools.deny ?? []), ...(patch.tools?.deny ?? [])]);

cfg.mcpServers = { ...(cfg.mcpServers ?? {}), ...(patch.mcpServers ?? {}) };
cfg.skills = { ...(cfg.skills ?? {}), ...(patch.skills ?? {}) };

const hookNames = ["SessionStart", "PreToolUse", "PostToolUse", "SessionEnd"];
cfg.hooks = cfg.hooks ?? {};
for (const hook of hookNames) {
  cfg.hooks[hook] = unique([...(cfg.hooks[hook] ?? []), ...(patch.hooks?.[hook] ?? [])]);
}

const prevContext = Array.isArray(cfg.contextFiles) ? cfg.contextFiles : [];
const nextContext = Array.isArray(patch.contextFiles) ? patch.contextFiles : [];
cfg.contextFiles = unique([...prevContext, ...nextContext]);

writeFileSync(targetCfgPath, `${JSON.stringify(cfg, null, 2)}\n`, "utf8");

if (existsSync(skillSrc)) {
  const targetSkills = join(target, "skills");
  mkdirSync(targetSkills, { recursive: true });
  cpSync(skillSrc, targetSkills, { recursive: true, force: true });
}

console.log(`[pack-install] installed ${packName} to ${target}`);
