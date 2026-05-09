# SEO Orchestrator Blueprint v1

## Layering

- L1: Orchestrator (`Orchestrators/SEO`)
- L2: Bundles (`Bundles/PSEO`, `Bundles/nichedigger`)
- L3: Packs (`Packs/*`)
- L4: Runtime/Data (`data/*`, Feishu tables)

## Responsibilities

- Route SEO intent to executable paths.
- Assign unified ids (`orchestrator_task_id`, `batch_id`, `run_id`).
- Drive dual-track state machine (PSEO track and keyword-eval track).
- Publish event/state/handoff records to memory bus.

## Canonical Actions

- `strategy_plan`
- `keyword_eval`
- `keyword_eval_sync`
- `pseo_publish`
- `pseo_republish`
- `rank_track`
- `views_sync`
- `feishu_reconcile`
- `audit_report`

## State Machine

PSEO:

- `draft -> queued -> publishing -> published -> indexed -> ranked -> views_synced`
- failure: `publish_failed`, `rank_failed`, `views_failed`, `sync_failed`

Keyword eval:

- `mined -> scored -> reviewed -> selected -> pushed_to_pseo`
- failure: `eval_failed`, `review_failed`, `sync_failed`

## Memory Integration

- Emit `event` for every transition and dispatch.
- Maintain `department_state` for each `(department, biz_key)`.
- Use `handoff` as strict cross-department API.
- Keep idempotent upsert semantics.

## Immediate Adoption Steps

1. Keep existing scripts and packs unchanged.
2. Standardize IDs and memory writes in orchestration entrypoints.
3. Add reconcile job that checks memory bus vs Feishu state.
4. Enable retry with new `run_id` and same `orchestrator_task_id`.
