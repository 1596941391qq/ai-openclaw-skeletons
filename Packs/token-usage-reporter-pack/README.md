# token-usage-reporter-pack

Lifecycle-level token accounting for OpenClaw runs.

## What it does

- `after_tool_call`: append token usage event (`.openclaw/logs/token-usage.jsonl`)
- `session_end`: aggregate session totals and write report (`.openclaw/reports/token-usage-latest.json`)

## Installation

```bash
node scripts/pack-install.mjs token-usage-reporter-pack
```

Or manually add to `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "token-usage-reporter": {
        "enabled": true
      }
    }
  }
}
```

## Output Files

- `~/.openclaw/logs/token-usage.jsonl` - Event stream (JSON Lines)
- `~/.openclaw/reports/token-usage-latest.json` - Session summary

## Data Policy

- Uses provider usage fields when available.
- Falls back to deterministic estimation when usage fields are missing.
- Reports are written to stderr for visibility.

## Implementation

This pack uses the OpenClaw Plugin API:
- `plugin.js` - Main plugin entry point with typed hooks
- Hooks: `after_tool_call`, `session_end`