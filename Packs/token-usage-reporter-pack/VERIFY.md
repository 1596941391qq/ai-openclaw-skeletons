# VERIFY

1. `openclaw.json` contains `hooks.internal.handlers` entries for token usage.
2. Hook scripts exist under `.openclaw/hooks/token-usage/`.
3. After a run, `.openclaw/logs/token-usage.jsonl` is appended.
4. Session end writes `.openclaw/reports/token-usage-latest.json`.
