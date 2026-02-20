import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const cfgPath = join(process.cwd(), "templates", ".openclaw", "openclaw.json");
if (!existsSync(cfgPath)) {
  console.error("[verify-pack] missing baseline openclaw.json");
  process.exit(1);
}

const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));

if (typeof cfg.hooks?.internal !== "object" || cfg.hooks.internal === null) {
  console.error("[verify-pack] hooks.internal must be object");
  process.exit(1);
}
if (typeof cfg.hooks.internal.enabled !== "boolean") {
  console.error("[verify-pack] hooks.internal.enabled must be boolean");
  process.exit(1);
}
if (typeof cfg.hooks.internal.entries !== "object" || cfg.hooks.internal.entries === null) {
  console.error("[verify-pack] hooks.internal.entries must be object");
  process.exit(1);
}
if (
  cfg.hooks.internal.load !== undefined &&
  !Array.isArray(cfg.hooks.internal.load?.extraDirs ?? [])
) {
  console.error("[verify-pack] hooks.internal.load.extraDirs must be array when provided");
  process.exit(1);
}
if (
  cfg.hooks.internal.handlers !== undefined &&
  !Array.isArray(cfg.hooks.internal.handlers)
) {
  console.error("[verify-pack] hooks.internal.handlers must be array when provided");
  process.exit(1);
}

if (typeof cfg.plugins?.entries !== "object" || cfg.plugins.entries === null) {
  console.error("[verify-pack] plugins.entries must be object");
  process.exit(1);
}

if (!Array.isArray(cfg.tools?.allow) || !Array.isArray(cfg.tools?.deny)) {
  console.error("[verify-pack] tools.allow/tools.deny must be arrays");
  process.exit(1);
}

console.log("[verify-pack] baseline config shape ok");
