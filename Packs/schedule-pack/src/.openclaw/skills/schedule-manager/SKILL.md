---
name: schedule-manager
description: Define, update, and validate recurring cron jobs for OpenClaw workflows.
---

# Schedule Manager

Use this skill to manage `schedules` in `.openclaw/openclaw.json`.

## Rules

- Every job must include `job_id`, `cron`, `workflow`, and `enabled`.
- Prefer idempotent workflows and explicit retry limits.
- Add business-safe defaults before enabling jobs.