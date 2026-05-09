# SEO Orchestrator

## Purpose

This layer coordinates SEO work across Bundles and Packs with one task identity, one state machine, and one memory trail.

## Scope

- Intent routing for SEO actions (`strategy_plan`, `keyword_eval`, `pseo_publish`, `rank_track`, `views_sync`, `reconcile`).
- End-to-end task tracking (`orchestrator_task_id`, `batch_id`, `run_id`).
- Retry and compensation rules for failed steps.
- Business memory publishing to cross-department memory bus.

## Memory

See:

- `Orchestrators/SEO/memory-contract.md`
- `data/memory-bus/schemas/*.schema.json`
- `data/memory-bus/samples/*.json`

## Design Rule

Bundles decide capability composition.  
Packs decide execution details.  
Orchestrator decides workflow, state transition, and memory consistency.
