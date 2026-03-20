# SLO / SLI / SLA 定義: mario-game

> ブラウザ上で動作するマリオ風2Dプラットフォーマーゲーム向けの Service Level 定義。
> TypeScript + Phaser 3.88.x / 静的ホスティング（GitHub Pages / Vercel）を前提とする。

---

## 1. SLI 定義（測定指標）

### SLI-001: フレームレート安定性

| 項目 | 内容 |
|------|------|
| 対応REQ | REQ-900 |
| 定義 | 30秒ウィンドウ内でフレーム間隔が 16.67ms（60fps相当）以下となったフレームの割合 |
| 測定単位 | % |
| 収集方法 | `requestAnimationFrame` コールバック内でタイムスタンプ差分を計算し、フレームカウンターを更新 |

```typescript
// 測定実装例（src/metrics/fps-monitor.ts）
let lastTimestamp = 0
let totalFrames = 0
let goodFrames = 0
const FPS_THRESHOLD_MS = 16.67

function measureFrame(timestamp: number): void {
  if (lastTimestamp > 0) {
    const delta = timestamp - lastTimestamp
    totalFrames++
    if (delta <= FPS_THRESHOLD_MS * 1.05) { // 5% 許容マージン
      goodFrames++
    }
  }
  lastTimestamp = timestamp
  requestAnimationFrame(measureFrame)
}
```

---

### SLI-002: 初期ロード時間

| 項目 | 内容 |
|------|------|
| 対応REQ | REQ-901、REQ-909 |
| 定義 | ブラウザがURLを開いてからタイトル画面でユーザー操作が可能になるまでの経過時間 |
| 測定単位 | ミリ秒（ms） |
| 収集方法 | `performance.timing.navigationStart` を起点に、Phaser TitleScene の `create()` 完了タイムスタンプを終点として計算 |

```typescript
// 測定実装例（src/scenes/TitleScene.ts 内）
create(): void {
  const loadTime = performance.now() - performance.timing.navigationStart
  MetricsCollector.record('initial_load_ms', loadTime)
}
```

---

### SLI-003: 入力遅延

| 項目 | 内容 |
|------|------|
| 対応REQ | REQ-900（操作応答性）|
| 定義 | キーダウンイベント発火から次の `requestAnimationFrame` でプレイヤー位置が更新されるまでの時間 |
| 測定単位 | ミリ秒（ms） |
| 収集方法 | `KeyboardEvent.timeStamp` と次フレームの rAF タイムスタンプの差分 |

```typescript
// 測定実装例（src/input/InputHandler.ts 内）
window.addEventListener('keydown', (e: KeyboardEvent) => {
  const keyTimestamp = e.timeStamp
  requestAnimationFrame((rafTimestamp) => {
    const latency = rafTimestamp - keyTimestamp
    MetricsCollector.record('input_latency_ms', latency)
  })
})
```

---

### SLI-004: レベルロード時間

| 項目 | 内容 |
|------|------|
| 対応REQ | REQ-918（lazy-load）|
| 定義 | ステージ遷移を開始してから新しいステージの `create()` が完了するまでの時間 |
| 測定単位 | ミリ秒（ms） |
| 収集方法 | `performance.mark()` / `performance.measure()` を Phaser シーン遷移フックに組み込む |

```typescript
// 測定実装例（src/scenes/GameScene.ts 内）
init(): void {
  performance.mark('level_load_start')
}

create(): void {
  performance.mark('level_load_end')
  const measure = performance.measure(
    'level_load',
    'level_load_start',
    'level_load_end'
  )
  MetricsCollector.record('level_load_ms', measure.duration)
}
```

---

### SLI-005: セーブ/ロード成功率

| 項目 | 内容 |
|------|------|
| 対応REQ | REQ-909（可用性・データ保護）|
| 定義 | `localStorage.setItem()` / `getItem()` が例外なく完了した操作の割合 |
| 測定単位 | % |
| 収集方法 | try-catch ブロックで成功・失敗カウンターを管理 |

```typescript
// 測定実装例（src/persistence/SaveManager.ts 内）
save(data: SaveData): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    MetricsCollector.increment('save_success')
    return true
  } catch (error) {
    MetricsCollector.increment('save_failure')
    console.warn('Save failed:', error)
    return false
  }
}
```

---

### SLI-006: クラッシュ率

| 項目 | 内容 |
|------|------|
| 対応REQ | REQ-903（ブラウザ互換性）|
| 定義 | セッション数に対して未処理の JavaScript エラー（`window.onerror`）が発生したセッションの割合 |
| 測定単位 | % |
| 収集方法 | `window.onerror` および `window.onunhandledrejection` でエラーを捕捉しセッションフラグを立てる |

```typescript
// 測定実装例（src/metrics/crash-reporter.ts）
let sessionHasCrashed = false

window.onerror = (message, source, lineno, colno, error): void => {
  if (!sessionHasCrashed) {
    sessionHasCrashed = true
    MetricsCollector.increment('crash_sessions')
    MetricsCollector.sendEvent('crash', { message, source, lineno })
  }
}

window.onunhandledrejection = (event: PromiseRejectionEvent): void => {
  if (!sessionHasCrashed) {
    sessionHasCrashed = true
    MetricsCollector.increment('crash_sessions')
    MetricsCollector.sendEvent('unhandled_rejection', { reason: String(event.reason) })
  }
}
```

---

## 2. SLO 目標値

| SLO ID | SLI | 目標値 | 計測ウィンドウ | 対応REQ |
|--------|-----|--------|--------------|---------|
| SLO-001 | フレームレート安定性 | >= 95% | 30秒ローリングウィンドウ | REQ-900 |
| SLO-002 | 初期ロード時間 P95 | <= 3,000ms（4G回線）/ <= 5,000ms（50Mbps） | セッション単位 | REQ-901 |
| SLO-003 | 入力遅延 P99 | <= 16ms（1フレーム以内） | セッション単位 | REQ-900 |
| SLO-004 | レベルロード時間 P95 | <= 1,000ms | ステージ遷移単位 | REQ-918 |
| SLO-005 | セーブ/ロード成功率 | >= 99.9% | 月次集計 | REQ-909 |
| SLO-006 | クラッシュ率 | <= 0.1% / セッション | 週次集計 | REQ-903 |
| SLO-007 | バンドルサイズ | <= 10MB（total） | ビルド単位 | REQ-902 |
| SLO-008 | テストカバレッジ | >= 80% | CI実行単位 | REQ-905、REQ-915 |
| SLO-009 | TypeScript型エラー数 | = 0 | CI実行単位 | REQ-904 |
| SLO-010 | ESLintエラー数 | = 0 | CI実行単位 | REQ-906 |

### 詳細補足

#### SLO-001（フレームレート）
- 対象端末: Intel Core i5-8250U CPU / 8GB RAM / Chrome 120+
- 計測条件: 敵10体・コイン30枚が画面内に同時存在するシナリオ
- 測定除外: ページ読み込み直後2秒間（初期化フェーズ）

#### SLO-002（初期ロード）
- 4G回線（約20Mbps相当）での P95 = 3秒
- 50Mbps回線（CON-006準拠）での P95 = 5秒
- 計測起点: ブラウザの `navigationStart`
- 計測終点: TitleScene `create()` 完了

#### SLO-003（入力遅延）
- 1フレーム = 1000ms / 60 = 16.67ms を上限とする
- P99 での保証（外れ値1%は許容）

---

## 3. Error Budget Policy

### エラーバジェットの定義

| SLO ID | 月間許容エラー時間/件数 |
|--------|----------------------|
| SLO-001 | フレームドロップ率 5%（30秒ウィンドウ内） |
| SLO-002 | P95超過: 月間セッションの 5%まで許容 |
| SLO-003 | P99超過: 月間入力イベントの 1%まで許容 |
| SLO-004 | P95超過: 月間ステージ遷移の 5%まで許容 |
| SLO-005 | 失敗操作: 月間Save/Load操作の 0.1%まで許容 |
| SLO-006 | クラッシュセッション: 月間セッションの 0.1%まで許容 |

### バジェット消費アラート閾値

| 消費率 | アクション |
|--------|-----------|
| 50%消費 | 開発チームへ通知（console.warn + GA イベント） |
| 75%消費 | 新機能追加を一時停止、パフォーマンス改善を優先 |
| 100%消費 | 緊急対応。リリースフリーズ、ホットフィックス対応 |

---

## 4. 測定方法

### 4.1 クライアントサイド計測（Performance API）

```typescript
// src/metrics/MetricsCollector.ts

const METRICS_VERSION = '1.0.0'

interface MetricEntry {
  name: string
  value: number
  timestamp: number
  sessionId: string
}

export class MetricsCollector {
  private static readonly sessionId = crypto.randomUUID()
  private static readonly buffer: MetricEntry[] = []

  static record(name: string, value: number): void {
    const entry: MetricEntry = {
      name,
      value,
      timestamp: performance.now(),
      sessionId: this.sessionId,
    }
    this.buffer.push(entry)
    this.checkThresholds(entry)
  }

  static increment(name: string): void {
    this.record(name, 1)
  }

  static sendEvent(category: string, params: Record<string, unknown>): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', category, {
        ...params,
        metrics_version: METRICS_VERSION,
        session_id: this.sessionId,
      })
    }
  }

  private static checkThresholds(entry: MetricEntry): void {
    const thresholds: Record<string, number> = {
      initial_load_ms: 3000,
      input_latency_ms: 16,
      level_load_ms: 1000,
    }
    const threshold = thresholds[entry.name]
    if (threshold !== undefined && entry.value > threshold) {
      console.warn(
        `[SLO Alert] ${entry.name} exceeded threshold: ${entry.value}ms > ${threshold}ms`
      )
      this.sendEvent('slo_violation', {
        metric: entry.name,
        value: entry.value,
        threshold,
      })
    }
  }
}
```

### 4.2 FPS モニタリング（requestAnimationFrame）

```typescript
// src/metrics/FpsMonitor.ts

const WINDOW_DURATION_MS = 30_000
const GOOD_FRAME_THRESHOLD_MS = 17.5 // 16.67ms + 5% マージン
const MIN_FPS_RATE = 0.95

export class FpsMonitor {
  private frames: number[] = []
  private lastTimestamp = 0
  private animationFrameId = 0

  start(): void {
    this.animationFrameId = requestAnimationFrame(this.tick.bind(this))
  }

  stop(): void {
    cancelAnimationFrame(this.animationFrameId)
    this.reportWindowMetrics()
  }

  private tick(timestamp: number): void {
    if (this.lastTimestamp > 0) {
      const delta = timestamp - this.lastTimestamp
      this.frames.push(delta)
      this.pruneOldFrames(timestamp)

      if (this.frames.length >= 30) {
        this.evaluateWindow()
      }
    }
    this.lastTimestamp = timestamp
    this.animationFrameId = requestAnimationFrame(this.tick.bind(this))
  }

  private pruneOldFrames(now: number): void {
    const cutoff = now - WINDOW_DURATION_MS
    // フレームタイムスタンプは累積で管理（簡略化のため件数ベースでもよい）
    if (this.frames.length > 1800) { // 30fps x 60s = 上限
      this.frames.shift()
    }
  }

  private evaluateWindow(): void {
    const goodFrames = this.frames.filter(
      (delta) => delta <= GOOD_FRAME_THRESHOLD_MS
    ).length
    const rate = goodFrames / this.frames.length

    if (rate < MIN_FPS_RATE) {
      console.warn(
        `[SLO-001 Alert] FPS rate ${(rate * 100).toFixed(1)}% < ${MIN_FPS_RATE * 100}%`
      )
      MetricsCollector.sendEvent('slo_violation', {
        metric: 'fps_rate',
        value: rate,
        threshold: MIN_FPS_RATE,
      })
    }
  }

  private reportWindowMetrics(): void {
    const goodFrames = this.frames.filter(
      (delta) => delta <= GOOD_FRAME_THRESHOLD_MS
    ).length
    const rate = this.frames.length > 0 ? goodFrames / this.frames.length : 1
    MetricsCollector.record('fps_rate', rate)
  }
}
```

### 4.3 Performance API ランドマーク

| マーク名 | タイミング |
|---------|-----------|
| `game_init_start` | `main.ts` 実行開始 |
| `phaser_boot_complete` | Phaser `boot` シーン完了 |
| `title_scene_ready` | TitleScene `create()` 完了（SLI-002終点） |
| `level_load_start` | GameScene `init()` 開始（SLI-004起点） |
| `level_load_end` | GameScene `create()` 完了（SLI-004終点） |

---

## 5. アラート設定

### 5.1 開発環境アラート（console.warn ベース）

| トリガー条件 | ログメッセージ | 緊急度 |
|------------|-------------|--------|
| 初期ロード > 3,000ms | `[SLO-002 WARN] Initial load ${value}ms exceeds 3000ms threshold` | WARN |
| 入力遅延 > 16ms | `[SLO-003 WARN] Input latency ${value}ms exceeds 16ms threshold` | WARN |
| レベルロード > 1,000ms | `[SLO-004 WARN] Level load ${value}ms exceeds 1000ms threshold` | WARN |
| FPS維持率 < 95% | `[SLO-001 WARN] FPS rate ${rate}% below 95% in 30s window` | WARN |
| Save失敗 | `[SLO-005 ERROR] Save operation failed` | ERROR |
| 未処理エラー検出 | `[SLO-006 CRITICAL] Unhandled error detected: ${message}` | ERROR |

### 5.2 本番環境アラート（Google Analytics イベント）

Google Analytics 4（gtag.js）を使用してイベントを送信する。

| イベント名 | パラメータ | 対応SLO |
|----------|-----------|--------|
| `slo_violation` | `metric`, `value`, `threshold`, `session_id` | 全SLO |
| `crash` | `message`, `source`, `lineno`, `session_id` | SLO-006 |
| `unhandled_rejection` | `reason`, `session_id` | SLO-006 |
| `save_failure` | `error_type`, `session_id` | SLO-005 |
| `level_load_slow` | `duration_ms`, `stage_id`, `session_id` | SLO-004 |

#### GA4 カスタムダッシュボード設定

```
Exploration レポートで以下を確認:
- slo_violation イベント数の時系列推移
- metric パラメータ別のフィルタリング
- セッション数に対するクラッシュ率の計算
```

### 5.3 CI/CD アラート（GitHub Actions）

| チェック | 失敗時の動作 | 対応SLO |
|---------|------------|--------|
| `npm run build` サイズチェック | PRブロック | SLO-007（REQ-902）|
| `npx tsc --noEmit` | PRブロック | SLO-009（REQ-904）|
| `npx eslint src/` | PRブロック | SLO-010（REQ-906）|
| `npx vitest run --coverage` カバレッジ80%未満 | PRブロック | SLO-008（REQ-905）|
| ビルド時間 > 60s | PRブロック | REQ-907 |

```yaml
# .github/workflows/ci.yml の抜粋
- name: Check bundle size
  run: |
    SIZE=$(du -sm dist/ | cut -f1)
    if [ "$SIZE" -gt 10 ]; then
      echo "ERROR: Bundle size ${SIZE}MB exceeds 10MB SLO" >&2
      exit 1
    fi
```

---

## 6. SLA 定義

> 本ゲームはセミナー教材として提供する静的サイトのため、商用SLAとは異なる形式で定義する。

| SLA項目 | 目標 | 計測方法 |
|--------|------|---------|
| ゲーム利用可能性（Availability） | 月間 99.5%（GitHub Pages / Vercel SLA に準拠）| 外形監視（UptimeRobot 等） |
| デプロイ頻度 | main push から 5分以内にデプロイ完了 | GitHub Actions ログ |
| インシデント対応時間 | クラッシュ報告から 24時間以内に修正PRを作成 | GitHub Issues |
| 月額インフラコスト | $0 | Billing レポート |

---

## 7. REQ対応マトリクス（非機能要件）

| REQ ID | 優先度 | 内容要約 | 対応SLO |
|--------|--------|---------|--------|
| REQ-900 | MUST | 60fps維持（Core i5-8250U / Chrome 120+）| SLO-001、SLO-003 |
| REQ-901 | MUST | 初期ロード 5秒以内（50Mbps）| SLO-002 |
| REQ-902 | MUST | バンドルサイズ 10MB以内 | SLO-007 |
| REQ-903 | MUST | Chrome/Firefox/Safari ブラウザ互換 | SLO-006 |
| REQ-904 | MUST | TypeScript strict / 型エラー0件 | SLO-009 |
| REQ-905 | MUST | テストカバレッジ 80%以上 | SLO-008 |
| REQ-906 | MUST | ESLintエラー 0件 | SLO-010 |
| REQ-907 | MUST | ビルド 60秒以内完了 | CI監視（SLO外）|
| REQ-908 | MUST | GitHub Actions で自動デプロイ | SLA（デプロイ頻度）|
| REQ-909 | MUST | HTTPS 200応答 3秒以内 | SLO-002、SLA（Availability）|
| REQ-910 | MUST | ソースファイル 400行以内 | CI lint チェック（SLO外）|
| REQ-911 | SHOULD | GPUメモリ 256MB以下 | 手動計測（Chrome DevTools）|
| REQ-912 | SHOULD | オブジェクトプール（50以上）| SLO-001（間接）|
| REQ-913 | SHOULD | キーボードフォーカス / コントラスト比 3:1 | アクセシビリティ監査（SLO外）|
| REQ-914 | SHOULD | 日英切替 | 機能テスト（SLO外）|
| REQ-915 | SHOULD | ゲームロジックカバレッジ 80%+ | SLO-008 |
| REQ-916 | SHOULD | CI自動テスト・ESLint on PR | SLO-009、SLO-010 |
| REQ-917 | SHOULD | 定数を constants.ts に集約 | CI lint チェック（SLO外）|
| REQ-918 | COULD | ステージアセットの lazy-load | SLO-004 |
| REQ-919 | COULD | JSDoc 全パブリックAPI | TypeDoc チェック（SLO外）|
| REQ-920 | COULD | Vercel デプロイ対応 | SLA（デプロイ頻度）|

---

## 8. 計測アーキテクチャ概要

```
[ブラウザ / ゲームエンジン]
        │
        ├── FpsMonitor (rAF タイムスタンプ差分)
        │         └── SLO-001 評価 → console.warn / GA4 event
        │
        ├── MetricsCollector (Performance API)
        │         ├── SLO-002: initial_load_ms
        │         ├── SLO-003: input_latency_ms
        │         └── SLO-004: level_load_ms
        │
        ├── SaveManager (try-catch)
        │         └── SLO-005: save_success / save_failure
        │
        └── crash-reporter (window.onerror)
                  └── SLO-006: crash_sessions

[Google Analytics 4]
        └── slo_violation イベント → カスタムダッシュボード

[GitHub Actions CI]
        ├── SLO-007: dist サイズチェック
        ├── SLO-008: vitest coverage
        ├── SLO-009: tsc --noEmit
        └── SLO-010: eslint
```

---

## 9. 改訂履歴

| バージョン | 日付 | 変更内容 |
|----------|------|---------|
| 1.0.0 | 2026-03-20 | 初版作成（REQ-900〜920対応）|
