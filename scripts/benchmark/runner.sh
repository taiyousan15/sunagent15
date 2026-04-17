#!/bin/bash
# TAISUN Benchmark Runner
# 全ベンチマークを実行し docs/benchmarks/ に結果を保存

set -e
REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_DIR"

DATE=$(date +%Y-%m-%d)
OUT_DIR="docs/benchmarks"
mkdir -p "$OUT_DIR"

echo "━━━ TAISUN Benchmark Runner ━━━"
echo "Date: $DATE"
echo "Output: $OUT_DIR"
echo ""

echo "[1/1] Token baseline..."
node scripts/benchmark/token-baseline.js > "$OUT_DIR/token-baseline-$DATE.json"
echo "  → $OUT_DIR/token-baseline-$DATE.json"

# Future benchmarks:
# echo "[2/N] Context size..."
# node scripts/benchmark/context-size.js > "$OUT_DIR/context-size-$DATE.json"
# echo "[3/N] MCP overhead..."
# node scripts/benchmark/mcp-overhead.js > "$OUT_DIR/mcp-overhead-$DATE.json"

echo ""
echo "━━━ Complete ━━━"
echo "Results: $OUT_DIR/"
echo ""
echo "Next: integrate claude-mem/airis-mcp-gateway and re-run to compare"
