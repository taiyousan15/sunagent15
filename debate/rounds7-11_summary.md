# Debate Rounds 7-11 サマリー

## 概要

| Round | 観点 | 対象問題 | 合意状態 |
|-------|------|---------|---------|
| 7 | コスト効率 | 問題#8: .env.example ラベル欠如 | AGREE ✅ |
| 8 | テスタビリティ | Round 1 PARTIAL 3件の再検討 | 全件 AGREE ✅ |
| 9 | 運用性 | 問題#9 Linux欠如、問題#10 ドキュメント不整合 | AGREE ✅ |
| 10 | エッジケース | 環境変数未設定時の各スキル挙動 | AGREE ✅（一部要調査） |
| 11 | ユーザー体験 | 新規ユーザーの初回躓きポイント | AGREE ✅ |

---

## Round 7: コスト効率 — 問題#8 .env.example ラベル欠如

### 結論
AGREE ✅ — セクション分離方式でラベル付け

### 確認した事実
- `.env.example` 191行のうち、優先度ラベルがあるのは行47の Reddit のみ（`- オプション`）
- `ANTHROPIC_API_KEY` が「必須」セクションに `GROQ_API_KEY`、`MINIMAX_API_KEY` と並列配置
- 実際の REQUIRED は `ANTHROPIC_API_KEY` 1件のみ

### 確定修正
- `.env.example` を3セクションに再編: `[REQUIRED]` / `[RECOMMENDED]` / `[OPTIONAL]`
- REQUIRED: `ANTHROPIC_API_KEY` のみ
- RECOMMENDED: `TAVILY_API_KEY`, `BRAVE_SEARCH_API_KEY`, `GITHUB_TOKEN`, `QDRANT_URL`（Round 10で追加）
- OPTIONAL: 残り全て
- `scripts/validate-env.ts` 新規作成（起動時 REQUIRED 変数チェック）

### 定量効果
新規ユーザーのセットアップ時間: 推定2〜5時間 → 15〜30分

---

## Round 8: テスタビリティ — Round 1 PARTIAL 3件の解決

### 結論
Round 1 の PARTIAL 3件が全件 AGREE に格上げ

### Finding 1: プレースホルダーテスト
- **確定方式:** fs.readFileSync + regex（動的 import+mock より適切）
- 理由: コマンドインジェクションは構造的問題であり静的パターンで検出可能
- Codex が `silent-error-catch` の regex を強化（catch+console パターン）

### Finding 2: CI カバレッジ閾値
- **確定修正:** `.github/workflows/ci.yml` 行98 の `--coverageThreshold='{}'` を削除
- 注意: 削除前に `npx jest --coverage` で現状確認推奨（既存コードが閾値未満の場合 CI 即失敗）

### Finding 3: CD テスト依存
- **確定修正:** `cd.yml` に `test` job を追加し `build: needs: test` を設定
- GitHub Actions の制約: 別ワークフロー（ci.yml）の job への `needs` 参照は不可

---

## Round 9: 運用性 — 問題#9 Linux欠如、問題#10 ドキュメント不整合

### 問題#9: INSTALL.md Linux対応欠如
- **確認:** `INSTALL.md` 行3に Linux 記載なし。`install.sh` に `linux*` 分岐なし（darwin のみ）
- **矛盾:** `cd.yml` 行143 のリリースノートは `macOS / Linux` 向けとして `curl | bash` を提示
- **確定修正:**
  - `INSTALL.md` 行3の対応OS更新（Linux 追加）
  - Linux セクション追加（Ubuntu 22.04 / Debian 12 推奨）
  - `install.sh` に SHELL_RC 検出分岐追加（Codex 修正版、`~/.bashrc` ハードコード回避）

### 問題#10: ドキュメント「5ツール」vs 実態「13ツール」
- **確認:** `docs/third-agent/20_PROXY_MCP_MVP.md` 行15: `Public Tools (5 tools)`
- **実態:** `src/proxy-mcp/server.ts` の `TOOLS` 配列: 13エントリ（差分 +8、全て validation 系）
- **確定修正:**
  - ドキュメントを13ツール表記に更新（Core 5 + Validation 8 の構造で記述）
  - `tests/unit/proxy-mcp/server.test.ts` に `TOOLS.length === 13` のアサーション追加

---

## Round 10: エッジケース — 環境変数未設定時の挙動

### 結論（Codex が重要な訂正を行った）

| エッジケース | 最終判定 |
|------------|---------|
| llm-judge ANTHROPIC_API_KEY 未設定 | 安全（catch で処理済み）、診断性改善のみ推奨 |
| intelligence undefined 伝播 | 行38 でガードあり、内部実装は要確認（amber） |
| ModelRouter null フォールバック | tsconfig strict 設定の確認が必要（amber） |
| CHROME_PATH 未設定 | 優先度低、Chrome 非使用時は無影響 |
| QDRANT_URL 未設定（Codex 新規発見） | memory_add への影響確認が必要、[RECOMMENDED] に追加 |
| VALIDATION_MODE=strict + APIキー無し | 矛盾状態、.env.example に注記追加 |

### Codex が Opus を訂正した重要な点
- `llm-judge.ts` の catch ブロック（行200-206）は 401 を `skipped: true` で安全処理済み
- `intelligence/index.ts` 行38 で既に truthy チェックが行われている

### 確定修正
- `llm-judge.ts`: `shouldSkip` 前に明示的 API キーチェック追加（診断性向上）
- `.env.example`: `QDRANT_URL` を `[RECOMMENDED]` セクションに移動 + 注記追加

---

## Round 11: ユーザー体験 — 新規ユーザーの躓きポイント

### 確認した主要な躓きポイント（実ファイルベース）

1. **README.md に .env 設定ステップがない** — インストール完了後に機能しない
2. **スキル数がハードコード（63）** — 実際の数と乖離するリスク
3. **初回確認コマンドが重すぎる** — `/intelligence-research` より `/skill-validator` が適切
4. **`claude .` で開く手順の欠如** — 新規ユーザーが Claude Code の開き方を知らない
5. **インストールで何が変わるか不明** — `~/.claude/skills/` への書き込みを知らない

### Codex が Opus を訂正した重要な点
- ANTHROPIC_API_KEY は Claude Code 自体が管理しており `.env` での設定は多くのスキルで不要
- `/mega-research` は初回確認コマンドに不適（重い、API キー推奨）→ `/skill-validator` が適切

### 確定修正
- `README.md`: .env 設定ステップ追加（文言はCodex修正版）、スキル数ハードコード削除
- `INSTALL.md`: `claude .` 手順追加、`/skill-validator` を初回コマンドとして追記、「インストールで変更されるもの」セクション追加

---

## 全ラウンド横断サマリー

### 確定修正一覧（優先度順）

| 優先度 | ファイル | 修正内容 | Round |
|--------|---------|---------|-------|
| Critical | `README.md` | .env 設定ステップ追加 | 11 |
| Critical | `.github/workflows/ci.yml` 行98 | `--coverageThreshold='{}'` 削除 | 8 |
| Critical | `.github/workflows/cd.yml` | test job + `needs: test` 追加 | 8 |
| High | `.env.example` | 3セクション再編（REQUIRED/RECOMMENDED/OPTIONAL） | 7 |
| High | `INSTALL.md` | Linux セクション追加 + claude. 手順 + 初回コマンド | 9/11 |
| High | `tests/regression/*.test.ts` | fs.readFileSync+regex 実装（4ファイル） | 8 |
| Medium | `docs/third-agent/20_PROXY_MCP_MVP.md` | 5ツール→13ツール更新 | 9 |
| Medium | `scripts/install.sh` | Linux SHELL_RC 分岐追加 + スキル数動的化 | 9/11 |
| Medium | `README.md` | スキル数ハードコード削除 | 11 |
| Low | `src/proxy-mcp/validation/llm-judge.ts` | APIキー未設定時の診断性改善 | 10 |
| Low | `scripts/validate-env.ts` | REQUIRED 変数の起動時チェック（新規作成） | 7 |

### 要調査項目（修正前に確認必要）

| 項目 | 確認方法 |
|------|---------|
| `src/intelligence/` 各フェッチャーの null ガード | 個別ファイルを Read して確認 |
| `tsconfig.json` の strict 設定 | `strict` フィールド確認 |
| `src/proxy-mcp/tools/memory.ts` の Qdrant 未起動時挙動 | 接続エラー処理確認 |
| `/skill-validator` スキルの依存関係 | SKILL.md 確認済み（存在する） |

### Codex が Opus を正しく訂正したケース（重要な学習）

1. **Round 10:** `llm-judge.ts` の catch が 401 を安全処理済み（Opus の「抜け穴」評価は過剰）
2. **Round 10:** `intelligence/index.ts` 行38 で既に truthy ガードあり
3. **Round 11:** ANTHROPIC_API_KEY は Claude Code が管理しており `.env` 不要なケースが多い
4. **Round 11:** `/mega-research` は初回確認に不適（API 依存・時間がかかる）

### Round 1 からの通算合意状況

| ラウンド | 問題数 | AGREE | PARTIAL | 備考 |
|---------|--------|-------|---------|------|
| Round 1 | 3 | 3 | 3 | Finding 1-3 は問題合意だが修正案がPARTIAL |
| Round 7 | 1 | 1 | 0 | |
| Round 8 | 3 | 3 | 0 | Round 1 PARTIAL を全件解決 |
| Round 9 | 2 | 2 | 0 | |
| Round 10 | 6 | 6 | 0 | 2件は要調査（amber） |
| Round 11 | 5 | 5 | 0 | |
| **合計** | **20** | **20** | **0** | Round 1 PARTIAL も解決済み |
