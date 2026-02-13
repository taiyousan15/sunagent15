# Metrics Data Directory

このディレクトリは Stage 1 メトリクス収集システムのデータストレージです。

## ファイル構成

```
data/
├── hook-event.log              # 全イベント記録（JSON Lines形式）
├── override.log                # Emergency Override ログ
├── metrics-daily/              # 日次集計ファイル
│   └── metrics-2026-02-13.json # 日付ごとの統計
└── alerts-2026-02-13.json      # 異常検知アラート
```

## データ収集フロー

1. **記録フェーズ** (自動)
   - Hook実行時 → metrics-collector.js が記録
   - JSON Lines形式で hook-event.log に追記

2. **集計フェーズ** (毎日23:59 / 手動実行可)
   - metrics-aggregator.js が前日データを集計
   - metrics-daily/*.json に統計結果を保存

3. **レポートフェーズ** (手動実行)
   - generate-metrics-report.js がレポート生成
   - metrics-dashboard.md を出力

## コマンド

```bash
# 日次集計実行（通常は自動）
npm run metrics:aggregate

# レポート生成
npm run metrics:report         # 全期間
npm run metrics:report:7d      # 直近7日
npm run metrics:report:30d     # 直近30日
```

## 期間

- **開始**: 2026-02-13
- **ベースライン報告**: 2026-02-20
- **成功基準**:
  - ブロック率 < 5%
  - False Positive率 < 10%
  - 処理時間 <10ms
