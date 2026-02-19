# OpenClaw Skeletons

Production-oriented, reusable skeleton repository for OpenClaw agent systems.

This public repository only contains generic infrastructure patterns. Domain-specific bundles or business workflows should live in private repositories.

## Scope

This repo is for:

- generic Packs (governance, routing, hook execution, context preload, scheduling, observability)
- baseline OpenClaw contracts and templates
- installation, verification, release, rollback scripts

This repo is not for:

- business-specific bundles
- private campaign workflows
- org-specific delivery pipelines

## Architecture

- Layer 1: `Pack` (small reusable capability unit)
- Layer 2: `Bundle` (composition of packs; kept generic here)
- Layer 3: `Release` (deployable snapshot)

## Generic Packs Included

- `audit-core-pack`
- `skill-router-pack`
- `hook-executor-pack`
- `context-preloader-pack`
- `audit-dashboard-pack`
- `schedule-pack`
- `token-usage-reporter-pack`

## Talos-Style Structured State

Dual-layer context model:

- Layer 1 (stable): `product-marketing-context.(md|json)`
- Layer 2 (dynamic): `campaign-ops-context.(md|json)`

Structured contracts:

- `contracts/schemas/layer1-product-marketing-context.schema.json`
- `contracts/schemas/layer2-campaign-ops-context.schema.json`
- `contracts/schemas/schedule-job.schema.json`
- `contracts/schemas/decision-log.schema.json`
- `contracts/schemas/token-usage-event.schema.json`
- `contracts/schemas/token-usage-report.schema.json`

## Automatic Token Usage Reporting

Install:

```bash
node scripts/pack-install.mjs token-usage-reporter-pack
```

Output:

- events: `.openclaw/logs/token-usage.jsonl`
- latest session report: `.openclaw/reports/token-usage-latest.json`

## Quick Start

```bash
git clone https://github.com/1596941391qq/ai-openclaw-skeletons.git
cd ai-openclaw-skeletons

node scripts/pack-install.mjs audit-core-pack
node scripts/pack-install.mjs skill-router-pack
node scripts/pack-install.mjs hook-executor-pack
node scripts/pack-install.mjs context-preloader-pack
node scripts/pack-install.mjs schedule-pack
node scripts/pack-install.mjs token-usage-reporter-pack
```

## Scripts

- `node scripts/pack-lint.mjs`
- `node scripts/verify-pack.mjs`
- `node scripts/release-install.mjs --dry-run`
- `pnpm openclaw-release -- rollback`

## Notes

- Pack installation is incremental merge only.
- Release install may replace runtime state, with backup+rollback.
- Keep private/business bundles in your private repo.