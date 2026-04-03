---
name: meta-ads-optimize
description: Meta広告自動最適化スキル - 予算調整・入札最適化・クリエイティブローテーション
---

# Meta Ads Optimize Skill

Meta広告のパフォーマンスを自動で最適化するスキル。

## 概要

このスキルは以下の最適化を実行します：

1. **予算最適化** - ROAS/CPAベースの自動調整
2. **入札最適化** - パフォーマンス連動入札
3. **クリエイティブローテーション** - 疲労検出と自動切替
4. **オーディエンス最適化** - 高パフォーマンスセグメント拡大

## 使用方法

```
/meta-ads-optimize <type> [options]
```

### 予算最適化

```bash
# 全キャンペーン最適化
/meta-ads-optimize budget

# 特定キャンペーン
/meta-ads-optimize budget --campaign-id 123456

# ドライラン（実行せず提案のみ）
/meta-ads-optimize budget --dry-run

# 最大調整幅指定
/meta-ads-optimize budget --max-change 30%
```

### クリエイティブ最適化

```bash
# クリエイティブローテーション
/meta-ads-optimize creative

# 疲労検出
/meta-ads-optimize creative --detect-fatigue

# 自動置換
/meta-ads-optimize creative --auto-replace
```

### A/Bテスト

```bash
# テスト開始
/meta-ads-optimize abtest --campaign-id 123456 --variable headline

# テスト結果確認
/meta-ads-optimize abtest --status

# 勝者適用
/meta-ads-optimize abtest --apply-winner
```

## 最適化ルール

### 予算調整ルール

```python
# ROAS ベース
if roas >= 4.0:
    budget_change = +30%  # 大幅増加
elif roas >= 3.0:
    budget_change = +15%  # 増加
elif roas >= 2.0:
    budget_change = 0%    # 維持
elif roas >= 1.0:
    budget_change = -20%  # 減少
else:
    budget_change = -50%  # 大幅減少 or 停止検討
```

### クリエイティブ疲労検出

```python
# 疲労スコア計算
fatigue_indicators = {
    "ctr_decline": ctr_current / ctr_initial < 0.7,
    "frequency_high": frequency > 4.0,
    "engagement_drop": engagement_rate < threshold,
    "days_running": days > 14
}

fatigue_score = sum(fatigue_indicators.values()) / len(fatigue_indicators)

if fatigue_score >= 0.5:
    action = "ROTATE"  # クリエイティブ切替推奨
```

### A/Bテスト判定

```python
# 統計的有意性チェック
from scipy import stats

def check_significance(control, variant, confidence=0.95):
    t_stat, p_value = stats.ttest_ind(control, variant)
    return p_value < (1 - confidence)

# サンプルサイズ確認
min_sample_size = 100  # 各バリアント最低100CV
```

## 最適化レポート

```markdown
# 最適化実行レポート

## 実行日時
2026-02-03 10:00 JST

## 予算調整

| キャンペーン | 変更前 | 変更後 | 理由 |
|-------------|--------|--------|------|
| Campaign A  | ¥10,000 | ¥13,000 | ROAS 3.5 → +30% |
| Campaign B  | ¥8,000 | ¥6,400 | CPA超過 → -20% |
| Campaign C  | ¥5,000 | ¥5,000 | 維持（ROAS 2.5） |

## クリエイティブローテーション

| 広告セット | 旧クリエイティブ | 新クリエイティブ | 理由 |
|-----------|-----------------|-----------------|------|
| AdSet A   | Creative-001    | Creative-005    | 疲労スコア 0.7 |

## A/Bテスト結果

| テスト | 勝者 | 改善率 | 有意性 |
|--------|------|--------|--------|
| Headline Test | Variant B | +15% CTR | p < 0.05 ✓ |

## 次回推奨アクション
1. Campaign A の Lookalike 拡大
2. Campaign B のターゲティング見直し
3. 新クリエイティブ3種追加
```

## 自動実行設定

```json
{
  "automation": {
    "budget_optimization": {
      "enabled": true,
      "schedule": "0 6 * * *",
      "max_daily_change": "30%",
      "min_data_days": 3
    },
    "creative_rotation": {
      "enabled": true,
      "schedule": "0 0 * * *",
      "fatigue_threshold": 0.5
    },
    "notifications": {
      "slack_webhook": "${SLACK_WEBHOOK_URL}",
      "notify_on": ["budget_change", "creative_rotate", "alert"]
    }
  }
}
```

## 安全機能

- **最大変更幅制限**: 1回の調整で±50%まで
- **最低予算保護**: 設定した最低予算以下にしない
- **学習期間保護**: 新規キャンペーン7日間は自動調整しない
- **ドライランモード**: 実行前に変更内容を確認可能
- **ロールバック**: 直近の変更を取り消し可能

## 関連

- `/meta-ads-analyze` - 分析スキル
- `/meta-ads` - メインコマンド
- `automation-architect` エージェント
