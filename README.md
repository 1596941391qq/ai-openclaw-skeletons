# ai-openclaw-skeletons

OpenClaw production skeleton monorepo.

## Layout

- `Packs/`: installable capability packs
- `Bundles/`: logical pack composition
- `Releases/`: full snapshots for one-shot install
- `contracts/`: shared schemas and naming constraints
- `scripts/`: install, verify, lint, and release scripts
- `templates/`: baseline `.openclaw` config templates

## Runtime Targets

- Windows: `%USERPROFILE%/.openclaw`
- macOS/Linux: `~/.openclaw`

## Core Rules

- Pack install is incremental merge only.
- Release install can replace target, but must backup first.
- Merge entrypoint is `~/.openclaw/openclaw.json`.
- Hooks are fixed at: `SessionStart`, `PreToolUse`, `PostToolUse`, `SessionEnd`.

## Commands

- Install one pack: `node scripts/pack-install.mjs <pack-name>`
- Release dry-run: `pnpm release-dry-run`
- Release rollback: `pnpm openclaw-release -- rollback`
