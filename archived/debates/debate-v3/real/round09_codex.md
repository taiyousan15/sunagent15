# Round 9 Codex (Operability)

1)
Title: Measured footprint mismatch (runs understated)
Severity: High
Evidence: du -sh => `3.9M /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/.claude/hooks/data/unified-metrics.jsonl`, `58M /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/research/runs/`; Opus claims `4.1M` + `5.7M` at `/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/debate-v3/real/round09_opus.md:5,12`.
Impact: Retention sizing and cleanup urgency are under-estimated by ~10x for `research/runs/`.
Fix: Add mandatory `du -sh` capture in debate evidence template and CI lint for stale numeric claims.

2)
Title: `unified-metrics.jsonl` is append-only in core writer
Severity: High
Evidence: `/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/src/unified-hooks/layer-4/metrics-recorder.ts:17,49` writes `.claude/hooks/data/unified-metrics.jsonl` via `appendFileSync` with no rotation/delete path; measured `3.9M` via du.
Impact: File grows monotonically; observability storage and read cost rise over time.
Fix: Implement in-writer rollover (size+age), gzip old shards, and max-retention days.

3)
Title: Checkpoint skip logs grow without cap
Severity: Medium
Evidence: `/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/.claude/hooks/checkpoint-guard.js:32,114` appends `checkpoint-skip.log`; measured `812K /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/.claude/hooks/data/checkpoint-skip.log` (du).
Impact: Operational logs accumulate in hot path, increasing noise and disk usage.
Fix: Apply per-file max-lines/max-size truncation or rotate on SessionEnd.

4)
Title: Rotation configs are manual; macOS scope is incomplete
Severity: High
Evidence: Manual install comments at `/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/taisun-logrotate.conf:2,6` and `/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/taisun-newsyslog.conf:2`; macOS list (`:5-8`) excludes `unified-metrics.jsonl` and `checkpoint-skip.log`.
Impact: Rotation is non-default and incomplete on macOS, so growth continues unattended.
Fix: Ship install script + absolute path templating; include all `hooks/data/*.jsonl|*.log` on macOS.

5)
Title: `research/runs/` retention policy is undefined in docs and artifacts accumulate
Severity: High
Evidence: `/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/research/README.md:10-11,30` defines run storage and “追記（消さない）”; measured `58M /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/research/runs/`; top-level run dirs count = `67`.
Impact: Long-term storage/backups/search cost grows and incident triage slows.
Fix: Add retention tiers (e.g., 30d hot, 90d cold, pinned forever) and scheduled pruning/archive.

6)
Title: Alert thresholds guarantee chronic criticals (on-call signal degradation)
Severity: Medium
Evidence: `/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/.claude/hooks/config/alert-config.json:4-5` sets `metricsFileSize critical=50000`; `/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/.claude/hooks/data/alerts.jsonl:1,4,7,10` repeatedly logs critical at `3491939` bytes for `unified-metrics.jsonl`.
Impact: Persistent critical state creates alert fatigue and reduces trust in alerts.
Fix: Re-baseline thresholds from percentiles and add dedupe/rate-limit/silence windows.
