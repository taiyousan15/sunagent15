# SLO: animal-match

> SLI/SLO/Error Budget 定義 / sdd-full パイプライン生成
> 生成日: 2026-03-19 | spec-slug: animal-match
> 入力: requirements.md (REQ-901〜REQ-903)

---

## 1. サービスレベル概要

| 項目 | 値 |
|------|-----|
| サービス名 | アニマルマッチ |
| 対象環境 | Production (Vercel + Supabase) |
| 測定期間 | 30日ローリングウィンドウ |
| レビュー頻度 | 月次（リリース後はWeekly） |

---

## 2. SLI（Service Level Indicators）定義

### SLI-001: 可用性（Availability）

| 項目 | 定義 |
|------|------|
| 測定対象 | 全HTTPリクエスト（`/api/*` エンドポイント） |
| 計算式 | `(ステータス < 500 のリクエスト数) / (全リクエスト数) × 100` |
| 除外 | `429`（レート制限）は分母・分子ともに除外 |
| データソース | Vercel Analytics / Edge Logs |
| 測定粒度 | 1分間隔集計 |

### SLI-002: レイテンシ（Latency）

| 項目 | 定義 |
|------|------|
| 測定対象 | `POST /api/diagnosis`（最重要エンドポイント） |
| 計算式 | サーバー側処理時間（リクエスト受信〜レスポンス送信） |
| パーセンタイル | P50 / P95 / P99 |
| データソース | Vercel Function Duration メトリクス |
| 測定粒度 | リクエスト単位 |

### SLI-003: エラー率（Error Rate）

| 項目 | 定義 |
|------|------|
| 測定対象 | 全APIレスポンス |
| 計算式 | `(5xx レスポンス数) / (全リクエスト数) × 100` |
| 除外 | 4xxはユーザーエラーのため除外 |
| データソース | Vercel Analytics |
| 測定粒度 | 5分間隔集計 |

### SLI-004: AI診断成功率（Diagnosis Success Rate）

| 項目 | 定義 |
|------|------|
| 測定対象 | `POST /api/diagnosis` のClaude Haiku API呼び出し |
| 計算式 | `(AI正常応答数) / (AI呼び出し数) × 100` |
| 備考 | キャッシュヒット時はAI呼び出しなし→分母に含めない |
| データソース | アプリケーションログ（構造化ログ） |

---

## 3. SLO（Service Level Objectives）定義

| SLO ID | SLI | 目標値 | 測定期間 | REQ |
|--------|-----|--------|---------|-----|
| SLO-001 | SLI-001 可用性 | >= 99.9% | 30日 | REQ-902 |
| SLO-002 | SLI-002 P50レイテンシ | <= 200ms | 30日 | REQ-901 |
| SLO-003 | SLI-002 P95レイテンシ | <= 500ms | 30日 | REQ-901 |
| SLO-004 | SLI-002 P99レイテンシ | <= 1,000ms | 30日 | REQ-901 |
| SLO-005 | SLI-003 エラー率 | <= 0.1% | 30日 | REQ-902 |
| SLO-006 | SLI-004 AI診断成功率 | >= 99.5% | 30日 | REQ-003 |

### SLO-001 根拠

- 99.9% = 月間ダウンタイム許容: 43分12秒
- Vercel SLA: 99.99%、Supabase SLA: 99.95%
- ボトルネック: Supabase（99.95%）→ 複合可用性は約99.94%
- 目標99.9%は達成可能な範囲

### SLO-002〜004 根拠

- P50 200ms: 六十干支計算（<1ms）+ DB書き込み（<50ms）+ キャッシュ済みHaiku結果返却（<50ms）
- P95 500ms: キャッシュミス時のHaiku API呼び出し（300-400ms）+ DB書き込み
- P99 1,000ms: Haiku APIのテールレイテンシ + ネットワーク遅延

---

## 4. Error Budget Policy

### 4.1 バジェット計算

| SLO | 目標 | 30日バジェット | 分単位 |
|-----|------|---------------|--------|
| SLO-001 可用性 | 99.9% | 0.1% = 43.2分 | 43分 |
| SLO-005 エラー率 | 0.1% | 仮に月10,000リクエスト → 10件まで許容 |

### 4.2 バジェット消費アクション

| 消費率 | アクション | 担当 |
|--------|----------|------|
| 0-50% | 通常運用。新機能開発を継続 | - |
| 50-75% | 警告。新機能デプロイは慎重に判断。ポストモーテム作成 | 運営者 |
| 75-100% | 新機能デプロイ凍結。信頼性改善に集中 | 運営者 |
| 100%超過 | 全デプロイ停止。インシデント対応のみ。ポストモーテム必須 | 運営者 |

---

## 5. アラート設定

### 5.1 アラートルール

```yaml
# Vercel / Supabase アラート設定（概念定義）

alerts:
  - name: high_error_rate
    description: "5xxエラー率が0.5%を5分間超過"
    condition: "SLI-003 > 0.5% for 5m"
    severity: critical
    action: "Vercel Slack通知 + 運営者メール"

  - name: high_latency_p95
    description: "P95レイテンシが1秒を5分間超過"
    condition: "SLI-002 P95 > 1000ms for 5m"
    severity: warning
    action: "Slack通知"

  - name: ai_failure_rate
    description: "Claude Haiku API失敗率が5%を超過"
    condition: "SLI-004 < 95% for 10m"
    severity: critical
    action: "Slack通知 + フォールバック自動有効化確認"

  - name: error_budget_50pct
    description: "月間エラーバジェット50%消費"
    condition: "error_budget_consumed > 50%"
    severity: warning
    action: "デプロイ判断レビューをトリガー"

  - name: error_budget_exhausted
    description: "月間エラーバジェット100%消費"
    condition: "error_budget_consumed >= 100%"
    severity: critical
    action: "新機能デプロイ凍結通知"
```

### 5.2 通知チャネル

| チャネル | 用途 | 対象 |
|---------|------|------|
| Slack #animal-match-alerts | 全アラート通知 | 運営者 |
| メール | Critical のみ | 運営者 |
| Vercel Dashboard | ログ・メトリクス確認 | 運営者 |

---

## 6. 監視ダッシュボード設計

### 6.1 メトリクスパネル

| パネル | データ | 表示形式 |
|--------|--------|---------|
| 可用性 | SLI-001 | ゲージ（99.9%ライン付き） |
| レイテンシ | SLI-002 P50/P95/P99 | 折れ線グラフ |
| エラー率 | SLI-003 | 折れ線グラフ |
| AI成功率 | SLI-004 | ゲージ |
| エラーバジェット残量 | バジェット消費率 | ゲージ（色付き） |
| リクエスト数 | 総リクエスト/分 | 折れ線グラフ |

### 6.2 実装方針

- MVP段階: Vercel Analytics + Supabase Dashboard で代替
- Phase2以降: 必要に応じてGrafana Cloud Free Tierを検討

---

## 7. SLO↔REQ トレーサビリティ

| SLO | REQ | 補足 |
|-----|-----|------|
| SLO-001 可用性 99.9% | REQ-902 | Vercel + Supabase の複合可用性 |
| SLO-002 P50 200ms | REQ-901 | 六十干支計算+キャッシュ |
| SLO-003 P95 500ms | REQ-901 | Haiku API含む |
| SLO-004 P99 1,000ms | REQ-901 | テールレイテンシ許容 |
| SLO-005 エラー率 0.1% | REQ-902 | 5xxのみ |
| SLO-006 AI成功率 99.5% | REQ-003 | フォールバック含む |
