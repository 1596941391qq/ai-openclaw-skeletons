import { existsSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

const home = os.homedir();
const target = join(home, ".openclaw");
const backups = readdirSync(home)
  .filter((name) => name.startsWith(".openclaw.backup-"))
  .sort()
  .reverse();

if (backups.length === 0) throw new Error("no backups found");

const latest = join(home, backups[0]);
if (existsSync(target)) rmSync(target, { recursive: true, force: true });
renameSync(latest, target);
console.log(`[rollback] restored ${backups[0]} to ~/.openclaw`);
