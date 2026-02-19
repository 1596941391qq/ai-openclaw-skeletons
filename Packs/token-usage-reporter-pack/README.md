# token-usage-reporter-pack

Lifecycle-level token accounting for OpenClaw runs.

## What it does

- `PostToolUse`: append token usage event (`.openclaw/logs/token-usage.jsonl`)
- `SessionEnd`: aggregate session totals and write report (`.openclaw/reports/token-usage-latest.json`)

## Data policy

- Uses provider usage fields when available.
- Falls back to deterministic estimation when usage fields are missing.