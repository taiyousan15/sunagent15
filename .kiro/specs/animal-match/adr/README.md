# ADR Index: animal-match

> Architecture Decision Records / sdd-full パイプライン生成
> 生成日: 2026-03-19 | spec-slug: animal-match

---

## ADR一覧

| ID | タイトル | ステータス | 日付 | 記述場所 |
|----|---------|----------|------|---------|
| ADR-001 | AIモデルにClaude Haikuを採用 | Accepted | 2026-03-19 | design.md §11 |
| ADR-002 | 認証基盤にSupabase Authを採用 | Accepted | 2026-03-19 | design.md §11 |
| ADR-003 | 決済にStripeを採用 | Accepted | 2026-03-19 | design.md §11 |
| ADR-004 | OGP画像生成にVercel OGを採用 | Accepted | 2026-03-19 | design.md §11 |
| ADR-005 | レート制限にUpstash Redis + Edge Middlewareを採用 | Accepted | 2026-03-19 | design.md §11 |
| ADR-006 | 独自名称「アニマルマッチ」「アニマルタイプ診断」を使用 | Accepted | 2026-03-19 | design.md §11 |

---

## ADRフォーマット

新規ADRを追加する場合は以下のフォーマットに従う:

```markdown
# ADR-NNN: タイトル

## ステータス
Proposed / Accepted / Deprecated / Superseded by ADR-NNN

## コンテキスト
決定が必要になった背景・課題

## 決定
選択した方針

## 根拠
選択理由・比較検討した代替案

## 影響
この決定による影響・トレードオフ
```
