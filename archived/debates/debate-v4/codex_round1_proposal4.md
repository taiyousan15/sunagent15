# Proposal 4 - Codex Pro Round 1 Critique
Verdict: PARTIAL
Evidence: 
```bash
$ du -sh .claude/hooks/data/unified-metrics.jsonl .claude/hooks/data/checkpoint-skip.log research/runs/
3.9M	.claude/hooks/data/unified-metrics.jsonl
852K	.claude/hooks/data/checkpoint-skip.log
 58M	research/runs/
```

```bash
$ python3 -c "import json; d=json.load(open('.claude/settings.json')); print(sum(len(h['hooks']) for cat in d.get('hooks',{}).values() for h in cat))"
31
```

```bash
$ grep -l -i 'rotate\|rotation\|cleanup\|prune' .claude/hooks/*.js | head -5
.claude/hooks/checkpoint-guard.js
.claude/hooks/context-snapshot-manager.js
.claude/hooks/cost-hard-stop-guard.js
.claude/hooks/metrics-collector.js
.claude/hooks/pre-compact-save.js
```

```bash
$ if [ -f .claude/hooks/log-rotator.js ]; then echo "exists"; else echo "missing"; fi
missing
```

```bash
$ rg -n "metricsFile|appendFileSync\(|setImmediate\(|flush\(|writeFileSync\(|renameSync\(" src/unified-hooks/layer-4/metrics-recorder.ts .claude/hooks/checkpoint-guard.js
.claude/hooks/checkpoint-guard.js:114:    fs.appendFileSync(SKIP_LOG, entry);
src/unified-hooks/layer-4/metrics-recorder.ts:17:  private readonly metricsFile = '.claude/hooks/data/unified-metrics.jsonl';
src/unified-hooks/layer-4/metrics-recorder.ts:29:      setImmediate(() => this.flush().catch(console.error));
src/unified-hooks/layer-4/metrics-recorder.ts:36:  private async flush(): Promise<void> {
src/unified-hooks/layer-4/metrics-recorder.ts:43:      const dir = path.dirname(this.metricsFile);
src/unified-hooks/layer-4/metrics-recorder.ts:49:      fs.appendFileSync(this.metricsFile, lines, 'utf8');
src/unified-hooks/layer-4/metrics-recorder.ts:65:      if (fs.existsSync(this.metricsFile)) {
src/unified-hooks/layer-4/metrics-recorder.ts:66:        const content = fs.readFileSync(this.metricsFile, 'utf8');
src/unified-hooks/layer-4/metrics-recorder.ts:84:      if (!fs.existsSync(this.metricsFile)) {
src/unified-hooks/layer-4/metrics-recorder.ts:88:      const content = fs.readFileSync(this.metricsFile, 'utf8');
```

```bash
$ rg -n "rotateLogIfNeeded|renameSync\(|appendFileSync\(|MAX_LOG_SIZE_MB|cleanupOldEntries|writeFileSync\(" .claude/hooks/metrics-collector.js .claude/hooks/cost-hard-stop-guard.js
.claude/hooks/cost-hard-stop-guard.js:57:function cleanupOldEntries() {
.claude/hooks/cost-hard-stop-guard.js:79:    fs.writeFileSync(tmpFile, keptLines.join('\n') + (keptLines.length > 0 ? '\n' : ''));
.claude/hooks/cost-hard-stop-guard.js:80:    fs.renameSync(tmpFile, COST_LOG);
.claude/hooks/cost-hard-stop-guard.js:90:    cleanupOldEntries(); // 月次cleanup（確率的）
.claude/hooks/cost-hard-stop-guard.js:123:    fs.appendFileSync(COST_LOG, entry);
.claude/hooks/cost-hard-stop-guard.js:139:    fs.appendFileSync(ALERT_LOG, entry);
.claude/hooks/metrics-collector.js:21:const MAX_LOG_SIZE_MB = 100;
.claude/hooks/metrics-collector.js:22:const MAX_LOG_SIZE_BYTES = MAX_LOG_SIZE_MB * 1024 * 1024;
.claude/hooks/metrics-collector.js:103:    await rotateLogIfNeeded();
.claude/hooks/metrics-collector.js:108:        fs.appendFileSync(EVENT_LOG_PATH, content, 'utf8');
.claude/hooks/metrics-collector.js:124:async function rotateLogIfNeeded() {
.claude/hooks/metrics-collector.js:132:    fs.renameSync(EVENT_LOG_PATH, rotatePath);
.claude/hooks/metrics-collector.js:170:  rotateLogIfNeeded
```

```bash
$ find research/runs -type f -name '*.json' -mtime +30 | wc -l
       0
```
Critique: Opus is right that growth pressure is real (`3.9M` + `852K` + `58M`) and a new rotator file does not yet exist (`missing`). However, the claim that anti-bloat mechanisms are wholly unimplemented is too strong: multiple hook files already contain rotation/cleanup/prune logic. Also, the current `checkpoint-skip.log` size claim (`804K`) is stale versus observed `852K`. Main risk gap in the proposal is concurrency safety: `unified-metrics.jsonl` and `checkpoint-skip.log` are actively appended by existing writers, so a SessionStart rotator that renames/truncates without lock coordination can lose or split writes under concurrent sessions/processes. For `research/runs`, deleting `>30d JSON` currently has near-zero impact (`0` files), so the proposed cleanup won’t address today’s `58M` immediately.
Counter-proposal: Implement one shared rotation helper used by the real writers (not a separate best-effort SessionStart hook): rotate just-before-append with lock file + atomic rename + bounded retention. Apply it first to `src/unified-hooks/layer-4/metrics-recorder.ts` (`unified-metrics.jsonl`) and `.claude/hooks/checkpoint-guard.js` (`checkpoint-skip.log`). For `research/runs`, start with non-destructive archive/compress retention (or explicit maintenance script) before automatic deletion.
