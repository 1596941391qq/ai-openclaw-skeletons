import { spawnSync } from "node:child_process";

const action = process.argv[2];
if (action === "rollback") {
  const out = spawnSync(process.execPath, ["scripts/release-rollback.mjs"], { stdio: "inherit" });
  process.exit(out.status ?? 1);
}

console.error("usage: node scripts/openclaw-release.mjs rollback");
process.exit(1);
