import { cpSync, existsSync, mkdirSync, renameSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const home = os.homedir();
const target = join(home, ".openclaw");
const releaseSource = join(process.cwd(), "templates", ".openclaw");
const ts = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
const backup = join(home, `.openclaw.backup-${ts}`);

if (!existsSync(releaseSource)) throw new Error(`release source not found: ${releaseSource}`);

if (dryRun) {
  console.log(`[release-dry-run] source=${releaseSource}`);
  console.log(`[release-dry-run] target=${target}`);
  console.log(`[release-dry-run] backup=${backup}`);
  process.exit(0);
}

if (existsSync(target)) {
  renameSync(target, backup);
  console.log(`[release] backup created: ${backup}`);
}

mkdirSync(target, { recursive: true });
cpSync(releaseSource, target, { recursive: true, force: true });
console.log(`[release] installed to ${target}`);

const backups = readdirSync(home)
  .filter((name) => name.startsWith(".openclaw.backup-"))
  .map((name) => ({ name, mtime: statSync(join(home, name)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);

for (const old of backups.slice(3)) {
  rmSync(join(home, old.name), { recursive: true, force: true });
  console.log(`[release] pruned backup ${old.name}`);
}
