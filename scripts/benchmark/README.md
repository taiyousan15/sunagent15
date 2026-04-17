# TAISUN Benchmark Infrastructure

claude-mem / airis-mcp-gateway / semantic search 等の外部ツール採否を
**実測値で決定**するためのベンチマーク基盤。

## 目的

Codex Pro Phase 3 監査の #20 DISPUTED（ROI ランキングの未検証問題）と
#21 AGREE（実測ベンチ基盤）への対応。

## 測定項目

| 項目 | スクリプト | 説明 |
|------|-----------|------|
| Token baseline | token-baseline.js | スキル/MCP 呼び出しあたりのトークン消費 |
| Context size | context-size.js | セッションライフサイクル中のコンテキスト推移 |
| MCP overhead | mcp-overhead.js | MCP 呼び出しの往復コスト |
| Memory recall | memory-recall.js | Praetorian 検索精度（今後実装） |

## 実行

```bash
node scripts/benchmark/token-baseline.js > docs/benchmarks/token-baseline-$(date +%Y%m%d).json
node scripts/benchmark/context-size.js > docs/benchmarks/context-size-$(date +%Y%m%d).json
bash scripts/benchmark/runner.sh          # 全ベンチマーク一括
```

## 結果の読み方

`docs/benchmarks/` に JSON で保存。
before/after 比較は `scripts/benchmark/compare.js` で差分表示。

## 意思決定フロー

1. Wave 4-1: 現状 baseline を測定（本実装）
2. Wave 4-2: claude-mem を一時有効化 → 再測定 → 差分
3. Wave 4-3: airis-mcp-gateway を一時有効化 → 再測定 → 差分
4. Wave 4-4: semantic search を実装 → 再測定 → 差分
5. Wave 4-5: 効果が 20% 以上のもののみ本採用
