import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const packsDir = join(root, "Packs");
const packs = readdirSync(packsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let failed = false;
for (const name of packs) {
  for (const item of ["README.md", "INSTALL.md", "VERIFY.md", "src"]) {
    if (!existsSync(join(packsDir, name, item))) {
      console.error(`[pack-lint] missing ${name}/${item}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(`[pack-lint] ok (${packs.length} packs)`);
