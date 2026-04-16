# v3 Codex Challenge: Round 1-5

> 実測日: 2026-04-15 / 検証者: Codex adversarial reviewer
> 方針: コード変更禁止・推測禁止・実測のみ

---

## Round 1: 機能正確性

### Round 1 Finding 1
**Verdict**: AGREE
**Reason**: `grep "dist/" package.json` 実測で10件確認（internal-mcp:rollout, obs:report:daily, obs:report:weekly, obs:post:daily, obs:post:weekly, chrome:debug:start, chrome:cdp:smoke, ops:schedule:run, ops:schedule:loop, ops:schedule:statusの10スクリプト）。完全削除はEENOENTで即死する事実は正確。
**Alternative**: `git rm -r --cached dist/` でトラッキングのみ除外。postinstallが `npm run build:all`（= proxy:build && scripts:build）を実行するため、clone後のユーザーへの影響はゼロ。

### Round 1 Finding 2
**Verdict**: PARTIAL
**Reason**: `prisma/schema.prisma` は実在し、`generator client { provider = "prisma-client-js" }` を宣言しており、15モデル（User, MileTransaction, Badge等）を定義している。しかし `src/` および `scripts/` 配下での `from "@prisma/client"` import は実測でゼロ件（0件）。つまり型生成済み成果物の利用者がいない状態。Opusは「削除禁止」と断言したが、実際には `npx prisma generate` 用のCLI依存なので devDependencies 降格が正確な判定。`@prisma/client` は現在 dependencies（`^7.5.0`）に配置されており、ランタイムで使われていない点はOpusの証拠評価が不十分。
**Alternative**: `dependencies` → `devDependencies` へ降格。schema.prismaが存在する以上 `prisma` CLI（devDep）と `@prisma/client`（devDep）はセットで保持が妥当。完全削除は schema.prisma 削除と同時実施の場合のみ可。

### Round 1 Finding 3
**Verdict**: AGREE
**Reason**: `src/utils/settings-merge.test.ts` からのimportが実測で1件のみ確認。`install.sh` 内での update-settings.js 参照は記述通り。TS版はテスト専用であり、本番コードがJS版（update-settings.js）を直接呼び出す構造は正確。ただし「役割分離を壊す可能性」は「壊す確率が高い」で、影響範囲はinstall-time処理のみ。
**Alternative**: ロジック共有する場合、update-settings.jsをESMまたはCJSの純粋関数ライブラリとして整備し、settings-merge.tsはその型付きwrapperに変更する方法が最も安全。ts-node依存の排除は必須。

---

## Round 2: アーキテクチャ

### Round 2 Finding 1
**Verdict**: AGREE（数値は正確）
**Reason**: 実測: `voice-ai-mcp-server/node_modules = 99M`、`ai-sdr-mcp-server/node_modules = 73M`。Opusの記載値と完全一致。`mcp-servers/` 配下には3サブプロジェクト存在（ai-sdr, line-bot, voice-ai）。line-bot-mcp-serverのnode_modulesサイズは未測定だが、3サブプロジェクトが独立インストールしている構造は事実。
**Alternative**: npm workspaces化は有効だが、line-bot-mcp-serverも含めた3つの移行が必要。Opusが「緊急性低」と評価したのは妥当だが、合計で少なくとも172M以上の重複コストは無視できない規模。

### Round 2 Finding 2
**Verdict**: PARTIAL
**Reason**: `tools/codebase-memory-mcp/` は実測で 130M 存在する。ただし `git ls-files tools/` で tracked ファイル数は0件。つまり既に untracked 状態のため、Opusが「tracked の可能性」と示した懸念は現時点では該当しない。バイナリはリポには入っていない。
**Alternative**: 現状問題なし。.gitignore への明示登録を確認するのみ。`git ls-files --others tools/codebase-memory-mcp/` で.gitignoreに保護されているか確認推奨。

### Round 2 Finding 3
**Verdict**: AGREE
**Reason**: `ls docs/ | grep proposal` で `proposal-v1-cost-optimized-model-routing.md` と `proposal-v2-final-cost-optimized-model-routing.md` の両方が実在確認。v1とv2最終版の並存は保守上の混乱を生む。
**Alternative**: `archived/proposals/` への移動で十分。ただしdocs/research-knowledge-scaling/（1.1M）のような他の残骸も同時整理すると効果的。

---

## Round 3: エラー処理

### Round 3 Finding 1
**Verdict**: AGREE
**Reason**: debate/ディレクトリはOpus Pre-Debate時点でのQ3実測（README.md:24からのみ参照）を引き継いでいる。再生成可能な一回限りの生成スクリプトである点は構造から妥当。ただし debate-v3/ が現在のアクティブ分析用であり、debate/ と debate-v2/ のみが移動対象となる。
**Alternative**: `archived/debates/v1/`（debate/）と `archived/debates/v2/`（debate-v2/）へ分離移動。debate-v3/ は現行ワークなので移動しない。

### Round 3 Finding 2
**Verdict**: AGREE
**Reason**: `package.json` の postinstall は `npm run build:all`（proxy:build && scripts:build）であることを実測確認。dist/ を git rm --cached した後、新規cloneユーザーがpostinstall失敗した場合の手順が README に存在しない（README.md 521行を確認。postinstall失敗時のリカバリ手順は記載なし）。Node.jsバージョン要件やtsc依存を明示する必要がある。
**Alternative**: README に「Prerequisites」セクションとして `Node 18+` と `npm run build:all` の手動実行手順を追加。CI での build 成功チェックを追加することで回帰防止。

### Round 3 Finding 3
**Verdict**: PARTIAL
**Reason**: `.taisun/memory/memory.jsonl` は実在し13,198行（約13M）。しかし `git ls-files .taisun/` の結果は0件 — 既に untracked 状態。つまり「配布リポから git rm --cached のみ」というOpusの判定は、実際にはすでに解決済みの問題を指している。現時点でこのデータは git に入っていない。
**Alternative**: 既にuntrackedなので即時対応不要。ただし .gitignore への `.taisun/` エントリが存在するか確認し、万が一の tracked 化を防ぐ防御的gitignoreを推奨。「ユーザー既存環境では削除しない」という方針判断自体は正しい。

---

## Round 4: パフォーマンス

### Round 4 Finding 1
**Verdict**: PARTIAL
**Reason**: `udemy-downloader/.venv` = 72M（実測、Opusの73Mと1M誤差）。`docs/research-knowledge-scaling/` = 1.1M（Opusの「research/runs/ 5.7M」とは別物）。「131M削減可能」の根拠が実測と一致していない。実測では udemy/.venv 72M が最大単体ターゲットで、research/runs/ の実測がない。Opusが「research/runs/」と呼んでいるのは docs/research-knowledge-scaling/ とは別のパスの可能性。
**Alternative**: `du -sh` で実際のサイズTop5を測定してから削減計画を立てる。72Mのvenv untackは確実に有効だが、「131M削減」という数値の根拠は再確認が必要。

### Round 4 Finding 2
**Verdict**: DISAGREE
**Reason**: `wc -l README.md` = 521行（実測）。Opusの「2000行以上疑惑」は実態と乖離している。521行は大きすぎるとは言えず、「毎セッション読み込まれる」という問題の規模も過大評価。CHANGELOG化の方向性は正しいが、Severity:mediumの根拠が弱い。
**Alternative**: 521行であれば現状維持でも許容範囲。CHANGELOG分離は任意改善。もし読み込みコストが問題なら、具体的なtoken数を計測してから判断する。

### Round 4 Finding 3
**Verdict**: AGREE（数値は正確）
**Reason**: 実測: `unified-metrics.jsonl = 4,059,151 bytes (約3.9M)`, `checkpoint-skip.log = 809,592 bytes (約790K)`。Opusの「unified-metrics 4.1M, checkpoint-skip.log 800K」と一致。これらに加えて `rules-enforce-skip.log = 782K`, `cost-tracking.jsonl = 461K`, `model-switch.log = 358K` も実測で確認。hooks/data/合計は6.6M。自動ローテーション機構がない点は事実。
**Alternative**: SessionEnd hookで月次チェック + 一定サイズ超過時に `hooks/data/archive/YYYY-MM/` へ退避する機構が有効。ファイル削除ではなくアーカイブ移動にすることで過去データを保持しつつサイズを抑制できる。

---

## Round 5: セキュリティ

### Round 5 Finding 1
**Verdict**: PARTIAL
**Reason**: `browser_profile/` ディレクトリは実在し（AutofillStates, Default, extensions_crx_cache等を含む完全なChromeプロファイル構造）。`.gitignore:96` に `.claude/skills/*/data/browser_profile/` が登録されており、`git ls-files .claude/skills/nanobanana-pro/data/browser_profile/` = 0件（現在はuntracked）。さらに git log でこのパスの過去コミット履歴もゼロ件。つまりOpusが「最優先でgit rm --cached + git filter-repo検討」と言った懸念は、現在および過去ともにgit trackingの事実がない。過去コミットへのpurgeは不要。
**Alternative**: 現状問題なし。ただし `.gitignore` が機能していることの定期確認（CI での `git ls-files | grep browser_profile` チェック）を追加することで再混入を防ぐ。Opusのcritical評価は現状に対しては過大だが、予防的monitoring自体は推奨。

### Round 5 Finding 2
**Verdict**: DISAGREE（判定は変更、根拠は別）
**Reason**: `git ls-files .taisun/` = 0件。.taisun/memory/memory.jsonlは既にuntrackedであり、「tracked なら即 untrack」というOpusの前提条件が現時点では成立していない。Severity:highの評価は現状では過大。
**Alternative**: 現状でgit追跡なし。保護として .gitignore に `.taisun/` エントリがあることを確認すれば十分。過去コミット履歴も確認: `git log --all --full-history -- .taisun/` で万全を期す。

### Round 5 Finding 3
**Verdict**: 要追加検証
**Reason**: `scripts/originals/backups/` の存在と絶対パス含有についての実測が本セッションでは未実施。Opusは「前回Explore調査で/Users/matsumototoshihiko含むと指摘」としており、本Findingは先行調査への参照のみ。独自実測が必要。
**Alternative**: `ls /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/originals/backups/` および `grep -r "/Users/" scripts/originals/backups/` を実行して確認。実在かつ絶対パス含有が確認されれば untrack + .gitignore追加が適切。

---

## サマリー判定表

| Round | Finding | Verdict | 核心理由 |
|-------|---------|---------|---------|
| R1-F1 | dist/削除破壊 | AGREE | 10件実測一致 |
| R1-F2 | @prisma/client削除 | PARTIAL | import 0件実測。devDep降格が正確な結論 |
| R1-F3 | settings-merge二重実装 | AGREE | 構造事実として正確 |
| R2-F1 | node_modules重複サイズ | AGREE | 99M/73M実測一致 |
| R2-F2 | tools/ バイナリtracked懸念 | PARTIAL | 既にuntracked(0件)。懸念は現在不在 |
| R2-F3 | proposal v1/v2並存 | AGREE | 両ファイル実在確認 |
| R3-F1 | debate/スクリプト削除安全 | AGREE | 外部参照ゼロの事実と整合 |
| R3-F2 | postinstall失敗時手順未整備 | AGREE | README 521行に記載なし |
| R3-F3 | memory.jsonl削除リスク | PARTIAL | 既にuntracked。問題は現状解決済 |
| R4-F1 | リポサイズ削減131M | PARTIAL | udemy 72Mは実測一致、131Mの根拠は未確認 |
| R4-F2 | README.md 2000行疑惑 | DISAGREE | 実測521行。過大評価 |
| R4-F3 | hooks/data肥大化 | AGREE | unified-metrics 3.9M, checkpoint-skip 790K実測一致 |
| R5-F1 | browser_profile tracked | PARTIAL | 現在も過去もgit tracking 0件。criticalは過大 |
| R5-F2 | memory.jsonl tracked | DISAGREE | 実測0件。現状問題なし |
| R5-F3 | backups/絶対パス漏洩 | 要追加検証 | 本セッション未実測 |
