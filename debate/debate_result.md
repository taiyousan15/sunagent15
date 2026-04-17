# Debate Review Result (15 Rounds, Opus × Codex-fallback agents)

**Target**: TAISUN Agent の他人利用ポータビリティ問題3件（Windows破綻 / update破壊 / サイレント失敗）の修正方針議論
**Mode**: agent fallback (code-reviewer 5並列 × 3ラウンド)
**Total findings**: 45件 (15ラウンド × 3)
**Agreed**: 23件 (51%)
**Partial**: 18件 (40%)
**Disagreed**: 4件 (9%)
**Fixes applied**: 0件 (--fix なし、議論のみ)

---

## 最終合意: 問題別の推奨修正方針

### 🔴 問題1（Windows破綻）— 合意方針: **オプションB（install.ps1 拡張）+ 即時1行修正**

#### 即時実行（コミット1本、breaking change なし）
1. **setup-project.ps1:181 の `.claude\agents` → `.claude\agent-source` に修正**
   - 出典: Round 13-3 AGREE (Critical), Codex補強（CI lintで再発防止）
   - 理由: 1行変更でデータ整合性が回復、最も確実
2. **install.ps1:17 `$Profile` → `$SkillProfile` 改名**
   - 出典: Round 1-1, 5-2, ベストプラクティス調査（PowerShell公式）
   - 理由: 業界慣行に従う、影響範囲は変数参照3箇所のみ

#### 短期実行（次PR、1-2週間）
3. **install.ps1 に `-Update` スイッチを追加**（別ファイル update.ps1 ではなく既存ファイル拡張）
   - 出典: Round 10-1 PARTIAL → Codex代替案で確定
   - 理由: package.jsonとの整合は `bash ... || powershell ...` の条件分岐で対応
4. **GitHub Actions windows-latest で install→update→verify 統合テスト追加**
   - 出典: Round 8-1 AGREE
5. **README.md にOS別アップデート手順を分岐記載**
   - 出典: Round 11-1 AGREE

#### 中期計画（次四半期）
6. **scripts/features.json で機能定義を共通化**（sh/ps1 が同じ定義を読む）
   - 出典: Round 12-1 AGREE, 15-2 AGREE
   - 理由: 二重メンテの根本原因を解消、Node.js全面書き直し（オプションC）は過剰

#### 不採用
- **オプションC（Node.js書き直し）**: Round 7-1 で開発工数 vs リスク不釣合いと合意

---

### 🔴 問題2（update破壊）— 合意方針: **オプションB（additive-only）+ オプションC（backup）+ README即時修正**

#### 即時実行（コード変更なし、最短インパクト）
1. **README.md:537「git pull && npm run setup」案内を修正**
   - 出典: Round 15-3 AGREE【最短インパクト】, 11-3 PARTIAL→Codexの「setup/setup:fresh分離」を採用
   - 修正案: 通常は `git pull && npm run update`、全リセット時のみ `npm run setup:fresh` と明示
   - 理由: コード修正前でも被害を限定可能

#### 短期実行（次PR）
2. **settings.json更新ロジックを additive-only + ユーザー値優先 deep merge に変更**
   - 出典: Round 1-2 AGREE, ccsettings実装パターン (research)
   - 詳細: 既存値はユーザー優先、新MCPは disabled:true で追加
3. **`~/.claude/settings.json.bak.{date}` 自動バックアップ + chmod 600 + FIFO 3世代**
   - 出典: Round 5-1 AGREE, 7-2 AGREE, 3-2 AGREE (失敗時はupdate中断)
4. **update完了時に「新規追加: N件 / 更新: M件 / 保持: K件」サマリー表示**
   - 出典: Round 9-2 AGREE
5. **`npm run setup:fresh` コマンドを別途追加**（破壊的操作を明示分離）
   - 出典: Round 11-2 AGREE, 11-3 Codex代替案

#### 中期計画
6. **MCPキーリネーム移行ガイドを別文書として用意**
   - 出典: Round 10-2 AGREE
7. **install.sh の merge関数を src/utils/settings-merge.ts に分離 + jest テスト追加**
   - 出典: Round 8-2 PARTIAL → 旧インラインコード削除を必須条件化（Codex補強）

#### 不採用
- **オプションA単独（deep-merge のみ）**: 新MCP自動追加が意図しない副作用を生む（Round 1-2 で合意）
- **オプションD単独（dry-run のみ）**: 非技術ユーザーに JSON diff は難解（Round 2-2 で合意）

---

### 🟠 問題3（サイレント失敗）— 合意方針: **オプションC（symlink check）+ 構造的なhookパス変更**

#### 即時実行
1. **hookパスを TAISUN_HOME 環境変数で絶対パス化**
   - 出典: Round 2-3 AGREE【構造的対処】
   - 理由: 「hook自身が無効状態を通知できない」根本矛盾を解消
   - 詳細: `[ ! -f $TAISUN_HOME/.claude/hooks/X.js ] && echo "TAISUN hooks inactive (set TAISUN_HOME)" >&2; exit 0`

#### 短期実行
2. **post-install verification を「APIを使わないローカルチェックのみ」に限定**
   - 出典: Round 7-3 DISAGREE → API使用なら問題、ローカルなら問題なしで両者合意
   - 内容: ファイル存在 / JSON構文 / symlink先存在 / hook件数 / version文字列一致
3. **dangling symlink 検証は -L && -e の二段階確認、非同期実行（`&`）で SessionStart hook へ追加**
   - 出典: Round 13-2 AGREE, 9-3 DISAGREE (Codex: 非同期で十分高速)
4. **Windows用 dangling 等価チェック: ファイル存在確認 + ハッシュ比較**
   - 出典: Round 10-3 AGREE
5. **hook検証は `.claude/hooks/` ディレクトリ動的スキャンに変更**（ハードコード廃止）
   - 出典: Round 12-3 AGREE
6. **install.sh:209-222 の warn-continue を、サブシェル局所化した fail-fast に変更**
   - 出典: Round 1-3 DISAGREE → Codex代替案「サブシェル局所化」採用で全スクリプト再設計を回避

#### 不採用
- **オプションB単純適用（fail-fast全面切替）**: 既存 set -e + `|| true` 構造との干渉リスク（Round 1-3）

---

## 修正の優先順位（リソース制約下）

| Phase | 期間 | 内容 | 影響範囲 |
|-------|------|------|---------|
| **P0 即時** | 1日 | 問題1の setup-project.ps1:181 1行修正 + 問題2の README.md修正 + 問題3 はTAISUN_HOME化計画立案 | コード変更2行、文書1ファイル |
| **P1 短期** | 1-2週間 | 問題2のadditive-only + backup + 問題1の-Updateスイッチ + 問題3のローカルverification | 機能追加、breaking changeなし |
| **P2 中期** | 次月 | Windows CI / merge関数のテスト分離 / hook動的スキャン | テスト・運用改善 |
| **P3 計画** | 次Q | features.json共通定義 / Node.js dispatcher導入 | 二重メンテ根本解消 |

---

## 議論で確定した「やらないこと」

1. **Node.js での全面書き直し**: 開発工数 5-10日 vs 段階対応で同等効果（Round 7-1）
2. **fail-fast への全面切替**: 既存 set -e 構造との干渉（Round 1-3 DISAGREE）
3. **post-installでAPI使用**: コスト・利用規約リスク（Round 7-3 DISAGREE合意）
4. **deep-mergeで新MCP自動追加**: ユーザーの意図しない有効化（Round 1-2 AGREE）

---

## DISAGREE 4件の最終位置づけ

| Item | 結論 |
|------|------|
| 1-3 fail-fast干渉 | Codex勝ち。サブシェル局所化で対応可、Opus分析の「全体再設計必要」は過剰 |
| 4-3 diagnose時間増加 | Codex勝ち。実測なしの推測。実装後に計測、3分超なら非同期化 |
| 7-3 APIコスト | Codex勝ち。validate-*.shの実コード確認後に再判定、現状は推測のみ |
| 9-3 dangling遅延 | Codex勝ち。100ファイルlstatは実測10ms未満、非同期実行で完全解決 |

→ **4件すべてOpus主張を撤回し、Codex代替案を採用**
