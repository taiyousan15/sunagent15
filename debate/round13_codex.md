# Round 13: データ整合性 — Codex Challenge

## Finding 13-1: JsonlStore 自動コンパクション不在 — AGREE（問題）、PARTIAL（修正案）

**問題の存在**: YES。`compact()` が `MemoryStore` インターフェースに含まれず、呼び出し側も存在しない。コメントの「periodic compaction」は虚偽記述。

**Opus修正案への反論（3点）**:
1. **操作カウント方式の問題**: `operationCount` はインメモリカウンタなので、プロセス再起動後にリセットされる。実際にはJSONLファイルの行数ベースで閾値判定するべき:
   ```typescript
   private async maybeCompact(): Promise<void> {
     // ファイル行数はdirty操作の累積でなくファイルサイズで判定
     const stats = fs.statSync(this.logFile);
     const entriesCount = this.entries.size;
     const logLines = /* appendされたdirty行 */ this.dirtyOps;
     if (this.dirtyOps > this.entries.size * 2) {
       await this.compact(); this.dirtyOps = 0;
     }
   }
   ```
   つまり「現エントリ数の2倍以上のOP行が蓄積されたらコンパクション」の方が正確。
2. **非同期コンパクションのブロッキング**: `add()` 内で `await this.maybeCompact()` を呼ぶとすべての書き込みがコンパクション待ちになる。バックグラウンドでスケジュールする（`setImmediate` または別プロセス）べき。
3. **競合状態**: コンパクション中に `add()` が呼ばれると `.tmp` ファイルへの書き込みと本ファイルへの追記が競合する。`compact()` 実行中フラグが必要。

**判定**: PARTIAL — 自動コンパクションの必要性はAGREE。Opus案のカウンタ方式より dirty-op-ratio 方式を推奨。競合状態のフラグ追加は必須。

---

## Finding 13-2: hooks/data/ ログ無制限蓄積 — AGREE（問題）、PARTIAL（修正案）

**問題の存在**: YES。unified-metrics.jsonl が4000行は実証済み。ローテーション機構なし。

**Opus修正案への反論（2点）**:
1. `appendWithRotation` でファイル全体を読み直す方式は、ファイルが大きい（数十MB）場合にI/Oスパイクを引き起こす。代替: `tail -n 2500` 相当のストリーム読み取りで古い行だけ切り捨てる。
2. **推奨はlogrotate**: Opusも言及しているが、OSレベルの `logrotate` の方が確実で副作用なし。`scripts/logrotate.conf` を追加し、インストール時に `sudo logrotate --install` するのが最善。macOS では `newsyslog.conf` 相当。

**判定**: PARTIAL — ログローテーション必要性はAGREE。実装はlogrotate/newsyslog設定ファイル追加を優先推奨。アプリ内実装は次善策。

---

## Finding 13-3: SupervisorState 1200文字切り詰めによる復元破壊 — AGREE（問題）、AGREE（修正方向）、PARTIAL（実装詳細）

**問題の存在**: YES かつ **Critical確定**。
- `graph.ts:97` で `contentPreview` を `JSON.parse()` している
- `contentPreview` は `service.ts:263` で 1200文字スライスされる
- 典型的な SupervisorState JSON は `plan.steps` や `input` が長ければ1200文字を超える
- 切り詰められたJSONは必ず `SyntaxError` → `catch` に落ち → `null` 返却 → 復元不能
- Supervisor の resume 機能が本質的に壊れている

**Opus修正案への反論（1点）**:
- `memoryGetContent(entryId)` を新規に公開する前に、`memorySearch` に `includeFullContent: true` オプションを追加する方が API の一貫性を保てる。ただし Opus 案のように `getContent(id)` を分離する方が DoS 耐性（検索結果全件にフル内容を含めない）の観点で正しい。

**判定**: AGREE（問題はCritical）、PARTIAL（API設計は `getContent(id)` の公開が適切）

---

## Codex 追加指摘

### Finding 13-4 (新規)
**Issue**: `loadState()` の catch ブロック (`graph.ts:105-107`) は `console.error` のみ。`recordEvent` でメトリクスに記録されないため、State 復元失敗が運用上見えない。
**Category**: observability / data-integrity
**Severity**: medium
**修正案**: catch 内で `recordEvent('supervisor_step', runId, 'fail', { errorType: 'state_load_failed', errorMessage: ... })` を追加する。
