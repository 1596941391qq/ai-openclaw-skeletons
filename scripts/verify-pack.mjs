import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const cfgPath = join(process.cwd(), "templates", ".openclaw", "openclaw.json");
if (!existsSync(cfgPath)) {
  console.error("[verify-pack] missing baseline openclaw.json");
  process.exit(1);
}

const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
for (const key of ["SessionStart", "PreToolUse", "PostToolUse", "SessionEnd"]) {
  if (!Array.isArray(cfg.hooks?.[key])) {
    console.error(`[verify-pack] hooks.${key} must be array`);
    process.exit(1);
  }
}

if (!Array.isArray(cfg.tools?.allow) || !Array.isArray(cfg.tools?.deny)) {
  console.error("[verify-pack] tools.allow/tools.deny must be arrays");
  process.exit(1);
}

console.log("[verify-pack] baseline config shape ok");
