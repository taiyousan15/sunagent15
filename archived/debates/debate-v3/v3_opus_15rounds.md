# v3 Debate: 15-Round Opus 4.6 Analysis (Refactoring Proposals Verification)

## Pre-Debate Fact Check (Opus 実測検証、推測ゼロ)

### Q1: dist/ 削除の是非 → **削除不可**
- `package.json:60-69` で `node dist/proxy-mcp/...` を **10 箇所直接参照**
- 例: `internal-mcp:rollout`, `obs:report:daily`, `obs:post:daily`, `chrome:debug:start`, `chrome:cdp:smoke`, `ops:schedule:run` 等
- dist/ 削除 → `npm run internal-mcp:rollout` 等が即 ENOENT で死ぬ
- 正解: `git rm -r --cached dist/` で **tracking だけ外す**、postinstall が build で再生成する

### Q2: .taisun/ 自動生成
- `install.sh:371` と `install.ps1:420` で **install 時に自動作成**
- 内容（memory.jsonl 13M + events.jsonl 3.8M）は **ランタイム生成**
- 削除判定: 中身は安全、ディレクトリ自体は install.sh 側で作成されるので touch しなくて OK

### Q3: debate/ 参照なし（外部スクリプトから）
- `README.md:24` の v2.53.3 entry で言及されるのみ（履歴）
- 外部呼び出しゼロ → archived/ 移動可能

### Q4: settings-merge 二重実装 → **本当に二重**
- `scripts/update-settings.js` は **本番コード**（install.sh:434, 437 から呼ばれる）
- `src/utils/settings-merge.ts` は **テスト専用**（test.ts のみが import）
- 同じロジック（additiveMerge/freshMerge/smartMerge）を JS と TS の両方に実装
- ロジック分岐時の乖離リスクあり

### Q5: @prisma/client の実態
- `package.json` + `package-lock.json` に依存宣言あり
- `prisma/schema.prisma` **存在する** → Prisma システム自体は使用中
- コード上の import は 0 件（md 例のみ）→ schema 管理専用の可能性
- 削除すると `npx prisma generate` 等が動かなくなる

---

## Round 1: 機能正確性 — dist/ 削除の影響範囲

### Finding 1
**Issue**: 提案 A5 (dist/ 削除) は package.json:60-69 の 10 個の npm script を破壊する
**Evidence**: `grep "dist/" package.json` で 10 件検出、各行が `node dist/proxy-mcp/...` のパターン
**Category**: code
**Severity**: critical
**判定**: **dist/ 完全削除は禁止**、代わりに `git rm -r --cached dist/` で tracking のみ外す
**他人影響**: postinstall で build が走るので他人は影響なし

### Finding 2
**Issue**: 提案 D1 (@prisma/client 削除) は schema.prisma が存在する限り危険
**Evidence**: `prisma/schema.prisma` 存在確認。Prisma CLI 経由の型生成等で必要
**Category**: code
**Severity**: high
**判定**: **@prisma/client 削除禁止**、ただし dependencies → devDependencies 降格は検討可

### Finding 3
**Issue**: 提案 C4 (settings-merge 統合) は本番コード/テストコードの役割分離を壊す可能性
**Evidence**: update-settings.js は install.sh:434, 437 の唯一の呼び出し先。settings-merge.ts はテスト専用
**Category**: architecture
**Severity**: medium
**判定**: 統合する場合、update-settings.js 側の standalone 性を保ちつつ **ロジックのみ共通化**（ts-node 依存を避ける必要）

---

## Round 2: アーキテクチャ — モジュール責務

### Finding 1
**Issue**: mcp-servers/ 2 サブプロジェクト（voice-ai, ai-sdr）が root 直下 node_modules と重複インストール
**Evidence**: `mcp-servers/voice-ai-mcp-server/node_modules = 99M`, `mcp-servers/ai-sdr-mcp-server/node_modules = 73M`, 両方に同じ @modelcontextprotocol/sdk
**Category**: architecture
**Severity**: medium
**判定**: npm workspaces 化で共通化可能だが、他人 install 時は postinstall で自動解決されるため **緊急性低**

### Finding 2
**Issue**: tools/codebase-memory-mcp/ がバイナリ単独配置（130M）
**Evidence**: `.gitignore:150` 登録済だが tracked の可能性
**Category**: architecture
**Severity**: low
**判定**: バイナリは Release に分離すべき、ただし要実測（`git ls-files tools/` で tracked か確認必須）

### Finding 3
**Issue**: `docs/proposal-v1-*.md` と `docs/proposal-v2-final-*.md` が並存
**Evidence**: `ls docs/ | grep proposal` で両バージョン確認
**Category**: content
**Severity**: low
**判定**: v1 は `archived/proposals/` 移動、v2 のみ残す

---

## Round 3: エラー処理 — 削除による連鎖障害

### Finding 1
**Issue**: debate/ の write_rounds.py と write_summary.py は再生成できる Python スクリプトのため削除安全
**Evidence**: `debate/write_rounds.py`, `debate/write_summary.py` は一回限りの生成用
**Category**: content
**Severity**: low
**判定**: debate/ 全体を archived/debates/v1/ 移動可

### Finding 2
**Issue**: dist/ を git rm --cached した後、他人が git pull した時に postinstall が失敗すると MCP 起動できない
**Evidence**: package.json:52 postinstall = `npm run build:all`
**Category**: code
**Severity**: high
**判定**: postinstall 失敗時のフォールバック手順を README に明記すべき

### Finding 3
**Issue**: .taisun/memory/memory.jsonl を削除するとユーザーの AI 記憶が失われる
**Evidence**: ファイルサイズ 13M = セッション履歴の蓄積
**Category**: data
**Severity**: high
**判定**: ユーザー既存環境では絶対削除しない、配布リポから `git rm --cached` のみ

---

## Round 4: パフォーマンス — リポサイズへの寄与

### Finding 1
**Issue**: 現状のリポサイズ寄与 Top 3 が全て gitignore 対象のはずのランタイムデータ
**Evidence**: node_modules 320M (除外)、次点で mcp-servers 173M、tools 130M、udemy-downloader 73M、research 58M
**Category**: architecture
**Severity**: medium
**判定**: udemy-downloader/.venv と research/runs/ を untrack するだけで 131M 削減可能

### Finding 2
**Issue**: ドキュメントで巨大な README.md（2000行以上疑惑）が毎セッション読み込まれる
**Evidence**: `wc -l README.md` 要実測
**Category**: architecture
**Severity**: medium
**判定**: CHANGELOG 化を推奨、v2.53.3 エントリは CHANGELOG に移動

### Finding 3
**Issue**: .claude/hooks/data/ の巨大 jsonl (unified-metrics 4.1M, checkpoint-skip.log 800K) が毎操作で成長
**Evidence**: Explore 調査で実測済
**Category**: architecture
**Severity**: high
**判定**: 日次/月次ローテーション機構を hook で実装（cron.json or SessionStart/End）

---

## Round 5: セキュリティ — 個人情報・秘密漏洩

### Finding 1
**Issue**: .claude/skills/nanobanana-pro/data/browser_profile/ に Autofill データが含まれる可能性
**Evidence**: browser_profile/AutofillStates/ のサブディレクトリが 200+、クロームプロファイル構造
**Category**: security
**Severity**: critical
**判定**: **最優先で git rm --cached + .gitignore 確実化**、過去コミットから purge（git filter-repo）検討

### Finding 2
**Issue**: .taisun/memory/memory.jsonl 13M にユーザーの会話履歴（API キー発言含む可能性）
**Evidence**: ファイル名が memory = 長期記憶、過去コミット履歴に含まれる可能性
**Category**: security
**Severity**: high
**判定**: `git ls-files .taisun/` で tracked か確認、tracked なら即 untrack

### Finding 3
**Issue**: scripts/originals/backups/ に絶対パスを含む自動生成 JSON
**Evidence**: 前回 Explore 調査で `/Users/matsumototoshihiko` 含むと指摘
**Category**: security
**Severity**: medium
**判定**: 個人パス漏洩、untrack 推奨

---

## Round 6: 日本語品質 — ドキュメント一貫性

### Finding 1
**Issue**: `ログ/` (日本語) と `logs/` (英語) が混在
**Evidence**: `ls -d ログ logs 2>&1` 両方存在
**Category**: content
**Severity**: low
**判定**: `logs/sessions/` に統一、日本語ディレクトリ名はクロスプラットフォーム懸念あり

### Finding 2
**Issue**: 英語コメント + 日本語コメントが .sh/.js 内で混在
**Evidence**: install.sh 内に両方あり（例: `# Xcode Command Line Tools 確認` と `# set -e`）
**Category**: content
**Severity**: low
**判定**: 日本語統一は現状維持（他人ユーザーも日本語話者想定）、ただし変数名・関数名は英語維持

### Finding 3
**Issue**: README.md と CHANGELOG.md の version 情報重複
**Evidence**: 両ファイルに v2.53.3 記載
**Category**: content
**Severity**: low
**判定**: CHANGELOG.md を Single Source of Truth にし、README から参照のみ

---

## Round 7: コスト効率 — 実装コスト vs 効果

### Finding 1
**Issue**: ランタイム untrack 系（A1-A4, A6-A10）は 10 分で完了し効果大
**Evidence**: git rm -r --cached のみ、10 コマンドで済む
**Category**: architecture
**Severity**: high (効果)
**判定**: **最優先実施**（コスト極小・効果大）

### Finding 2
**Issue**: npm workspaces 化（D2）は実装 2-3 日、効果は install 時間短縮のみ
**Evidence**: mcp-servers/ の構造変更 + CI 更新必要
**Category**: architecture
**Severity**: low (効果)
**判定**: **優先度低**、Phase P7 以降で検討

### Finding 3
**Issue**: hook readStdin 統合（C1）は実装 1-2 日、バグ導入リスクあり
**Evidence**: 14 hook の同時修正が必要
**Category**: code
**Severity**: medium
**判定**: 段階的移行（1 日 2-3 hook ずつ）、一括置換は禁止

---

## Round 8: テスタビリティ — 修正後のテスト可否

### Finding 1
**Issue**: git rm --cached は副作用なしのためテスト不要、ただし CI で tracked 再発していないか継続監視必要
**Evidence**: GitHub Actions に `git ls-files | grep <pattern>` チェック追加可能
**Category**: test
**Severity**: medium
**判定**: Windows CI のように回帰ガード追加推奨

### Finding 2
**Issue**: settings-merge 統合（C4）はテスト既存（57 suites / 1107 tests）でカバー済
**Evidence**: `src/utils/settings-merge.test.ts` に 15 tests
**Category**: test
**Severity**: low
**判定**: 統合実施時は既存テストが全 PASS を維持することで検証可能

### Finding 3
**Issue**: docker-compose 5 ファイル統合（B2）のテスト方法が不明
**Evidence**: `docker compose -f ... up -d --wait` 等の smoke test が必要
**Category**: test
**Severity**: medium
**判定**: 統合前に各 compose の動作確認テストを先に作る

---

## Round 9: 運用性 — ログ・デバッグ

### Finding 1
**Issue**: .claude/hooks/data/*.log の肥大化に自動対策なし（Explore E1-E3）
**Evidence**: unified-metrics.jsonl 4.1M、checkpoint-skip.log 794K
**Category**: architecture
**Severity**: high
**判定**: log rotation hook を追加（SessionEnd で月次チェック）

### Finding 2
**Issue**: research/runs/ の古い json が自動削除されない
**Evidence**: 2026-03-06 からの runs が残存、総 5.7M
**Category**: architecture
**Severity**: medium
**判定**: 30 日超過の自動削除を research-system skill に追加

### Finding 3
**Issue**: agent-output/ ディレクトリの役割が不明、6 サブディレクトリあり
**Evidence**: `ls agent-output/` = 6 entries (336K)
**Category**: architecture
**Severity**: low
**判定**: README に説明追加、または archived/ 移動

---

## Round 10: エッジケース — 他人環境での動作

### Finding 1
**Issue**: dist/ を git rm --cached した後、他人が git clone → postinstall 失敗時のリカバリ手順
**Evidence**: npm run build:all が Node 18+ + tsc 必要
**Category**: architecture
**Severity**: high
**判定**: README に「postinstall 失敗時は手動で `npm run build:all` を実行」を明記

### Finding 2
**Issue**: Windows で `git rm -r --cached` が大量パス除外時にタイムアウトする可能性
**Evidence**: なし（推測）
**Category**: code
**Severity**: low
**判定**: **実測で検証が必要**、現時点で推測判断しない

### Finding 3
**Issue**: .gitignore 追加対象の Japanese path (`ログ/`) が Windows で CRLF 問題起こす可能性
**Evidence**: .gitattributes:1 で text=auto が設定済
**Category**: code
**Severity**: low
**判定**: 現状問題なし、.gitattributes が対処済

---

## Round 11: ユーザー体験 — 他人 install 視点

### Finding 1
**Issue**: ルート直下の初見混乱（debate/ 3 種、docker-compose 5 種、SESSION_HANDOFF.md）
**Evidence**: `ls -la` で top-level 65 entries
**Category**: content
**Severity**: medium
**判定**: archived/ 集約 + docker/ ディレクトリ移動で改善

### Finding 2
**Issue**: .env.example が 3 ファイル（main, ops, tools）存在し初見で何を見るべきか不明
**Evidence**: `.env.example + .env.ops.example + .env.tools.example`
**Category**: content
**Severity**: medium
**判定**: config/env-templates/ に統合、README に役割説明追加

### Finding 3
**Issue**: README の最新バージョン記載が 1 行で長すぎる（v2.53.3 entry が数千字）
**Evidence**: README.md:24 が 1 行
**Category**: content
**Severity**: low
**判定**: CHANGELOG.md に詳細移動、README は要点のみ

---

## Round 12: 保守性 — 将来の変更しやすさ

### Finding 1
**Issue**: install.sh と setup-project.sh の重複（C2）は将来の install ロジック変更時の同期コスト大
**Evidence**: install.sh:280-357 と setup-project.sh:147-214 が ~80 行重複
**Category**: architecture
**Severity**: high
**判定**: 共通関数を `scripts/lib/setup-common.sh` に抽出、両方から source

### Finding 2
**Issue**: install.ps1 と setup-project.ps1 の同様重複（C3）
**Evidence**: 同上のパターン
**Category**: architecture
**Severity**: high
**判定**: `scripts/lib/setup-common.ps1` に抽出

### Finding 3
**Issue**: hook readStdin 14 ファイル重複（C1）は将来の stdin 処理変更時に全 14 ファイル修正必要
**Evidence**: Codex 監査で 14/22 hook が自前定義
**Category**: architecture
**Severity**: medium
**判定**: 段階移行（1 週間 5 hook ずつ）

---

## Round 13: データ整合性 — 状態管理

### Finding 1
**Issue**: .workflow_state_backups/ が 3 件 commit 済だが、`.workflow_state.json` の世代管理メカニズムが不明
**Evidence**: `find .workflow_state_backups -type f | wc -l = 3`
**Category**: data
**Severity**: low
**判定**: コードで参照されていない履歴残骸なら untrack 可、要調査

### Finding 2
**Issue**: debate-v2/ が 1 ファイルのみ（agreement_summary.md）で残骸疑惑
**Evidence**: `find debate-v2/ -type f` で 1 件
**Category**: content
**Severity**: low
**判定**: debate/ に統合、debate-v2/ 削除

### Finding 3
**Issue**: checkpoints/ (94 ファイル) の世代管理ポリシー不明
**Evidence**: Explore 調査で 376K 検出
**Category**: data
**Severity**: medium
**判定**: 世代数上限の設定（例: 最新 10 世代）を hook で実装

---

## Round 14: 法務・プライバシー

### Finding 1
**Issue**: browser_profile/ のクロームプロファイルに公開 URL のキャッシュ含む可能性（プライバシー）
**Evidence**: Round 5 で security critical 認定
**Category**: security
**Severity**: critical
**判定**: 最優先 untrack + git history purge 検討

### Finding 2
**Issue**: scripts/originals/backups/ の自動バックアップ JSON に絶対パス含有
**Evidence**: 前回監査で `/Users/matsumototoshihiko` 検出
**Category**: security
**Severity**: medium
**判定**: untrack、.gitignore に確実登録

### Finding 3
**Issue**: kuromoji 依存（MIT license、2016年最終更新）のライセンス/脆弱性状態
**Evidence**: npm audit では現状 0 件、package.json:118 で ^0.1.2
**Category**: security
**Severity**: low
**判定**: 現状維持、代替への移行は別 Issue（既に #308 関連）

---

## Round 15: 統合レビュー — 最終優先順位

### Finding 1（最優先・高インパクト低リスク）
**Issue**: ランタイムデータの git untrack 一括実施（A1-A4, A6-A10）
**Evidence**: 全て .gitignore 登録済、git rm --cached のみで完了
**Category**: architecture
**Severity**: high (効果)
**判定**: **Phase P6 として即実施推奨**
**他人影響**: ゼロ（これらファイルは各ユーザーの環境で再生成される）

### Finding 2（中優先・中リスク）
**Issue**: debate/ 3 ディレクトリ + docker-compose 5 ファイル + ログ/ の構造整理
**Evidence**: B1-B5、合計 ~100 ファイル移動
**Category**: architecture
**Severity**: medium
**判定**: **Phase P7**、各移動後に npm run test + taisun:verify で PASS 確認
**他人影響**: 各 compose を直接実行している他人がいれば影響、README 案内で回避

### Finding 3（低優先・設計要）
**Issue**: コード重複統合（C1-C5）、依存最適化（D1-D3）、log rotation（E1-E3）
**Evidence**: 各項目で 1-3 日の実装コスト
**Category**: architecture
**Severity**: medium
**判定**: **Phase P8 以降**、各項目を個別 PR で段階実施
**他人影響**: 各 PR で互換性検証必須
