# SEO Orchestrator Memory Contract

## 1. Goals

- Full traceability for business decisions and execution outcomes.
- Cross-department progress sync without coupling departments to each other's internals.
- Replay-safe updates (idempotent writes).

## 2. Entities

- `event`: immutable log item produced by orchestrator or department.
- `department_state`: latest state snapshot per department and business key.
- `handoff`: explicit "next department action" contract.

## 3. Global Keys

- `orchestrator_task_id`: unique root id for one user request.
- `batch_id`: groups related operations.
- `run_id`: one execution run for a batch.
- `biz_key`: stable business primary key, recommended `brand|website|keyword`.

## 4. Event Types

- `intent_routed`
- `task_created`
- `task_dispatched`
- `task_succeeded`
- `task_failed`
- `retry_scheduled`
- `handoff_created`
- `handoff_acknowledged`
- `reconcile_done`

## 5. Write Rules

- `event` append only.
- `department_state` upsert by `(department, biz_key)`.
- `handoff` upsert by `(from_department, to_department, biz_key, action)`.
- Any writer must include `trace: { orchestrator_task_id, batch_id, run_id }`.

## 6. Cross-Department Interop

- SEO publishes standardized handoffs to:
  - `ContentDept` (article generation/refresh)
  - `PublishDept` (uni funcs/gh pages operations)
  - `AnalyticsDept` (rank/views validation)
- Any department may consume `handoff` and must write back `handoff_acknowledged` event.

## 7. Recovery

- If an action fails, write `task_failed` + reason.
- Retry creates new `run_id`, reuses `orchestrator_task_id` and `batch_id`.
- Reconciliation compares latest `department_state` against required state graph.

## 8. Storage Layout

- `data/memory-bus/events-YYYY-MM.jsonl`
- `data/memory-bus/department-state.json`
- `data/memory-bus/handoffs.json`

## 9. Audit Queries (minimum)

- By `orchestrator_task_id`: full lifecycle timeline.
- By `biz_key`: cross-department state convergence.
- By `status=failed`: failure root cause and retry count.
