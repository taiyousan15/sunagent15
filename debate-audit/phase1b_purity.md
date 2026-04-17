# Phase 1B: Repository Purity Audit

## Summary
- 総検出数: 52件
- 削除推奨: 19件 / 保持妥当: 33件
- 影響規模（概算）: 693,976 KB / 14,183 files

## Category 1: Developer-specific files
| path:line | 要素数 | 影響範囲 | 判定 | 理由 |
|---|---:|---|---|---|
| `.agent_usage_state.json:5` | 1 file | ローカル絶対パス露出（他プロジェクトパス含む） | 削除推奨 | セッション固有メタデータで再生成可能。リポ純度観点で不要。 |
| `.workflow_state.json:7` | 1 file | Workflow進行状態の保持 | 保持妥当 | `.gitignore`管理下で、セッション継続機能が明示的に参照（`src/proxy-mcp/workflow/store.ts:10`）。 |
| `SESSION_HANDOFF.md:46` | 1 file | セッション引継ぎ情報 | 保持妥当 | 自動生成注記あり。`.gitignore`管理下（`.gitignore:147`）で運用ファイル。 |
| `.claude/commands/kindle-auto.md:1` | 3 files | Kindle専用コマンド群（`kindle-auto/book/publish`） | 削除推奨 | TAISUN本体機能と直接結合が確認できず、新規混入ファイル。 |

該当なし: なし

## Category 2: Stale backups
| path:line | 要素数 | 影響範囲 | 判定 | 理由 |
|---|---:|---|---|---|
| `.claude/settings.json.bak.2026-04-16T07-52-56:1` | 1 file | 設定バックアップ | 削除推奨 | 日付付き`.bak`で一時退避用途。現行設定運用には不要。 |
| `.claude/settings.json.backup:1` | 2 files | 過去設定バックアップ群 | 削除推奨 | `.backup`世代が重複。保守対象の現行設定と分離されている。 |
| `.claude/CLAUDE.md.backup-20260407:1` | 2 files | 旧CLAUDE.mdスナップショット | 削除推奨 | 版管理はGit履歴で代替可能。ローカル退避の残骸。 |
| `.claude/skills/nanobanana-pro/data/browser_profile/Default/LOG.old:1` | 26 files | ブラウザProfile旧ログ | 削除推奨 | `LOG.old`は典型的な古いバックアップ/ローテーション残骸。 |

該当なし: なし

## Category 3: Unused npm dependencies
| package | used? (evidence) | 判定 | 理由 |
|---|---|---|---|
| `@modelcontextprotocol/sdk` | NO by required grep (0 hits), but subpath importあり (`mcp-servers/voice-ai-mcp-server/src/index.ts:2`) | 保持妥当 | 指定パターンは`@modelcontextprotocol/sdk/server/...`を捕捉しないため。実使用あり。 |
| `clsx` | YES x1 (`src/lib/utils.ts:1`) | 保持妥当 | 実importあり。 |
| `dotenv` | YES x2 (`scripts/mcp-health-check.js:40`) | 保持妥当 | 実import/requireあり。 |
| `express` | YES x2 (`src/app.ts:1`) | 保持妥当 | 実importあり。 |
| `kuromoji` | YES x2 (`src/intent-parser/core/tokenizer.ts:7`) | 保持妥当 | 実importあり。 |
| `tailwind-merge` | YES x1 (`src/lib/utils.ts:2`) | 保持妥当 | 実importあり。 |
| `yaml` | YES x5 (`tests/utils/test-helpers.ts:7`) | 保持妥当 | 実importあり。 |
| `@prisma/client` | NO x0 (required grep) | 削除推奨 | コード側import/require実使用が確認できない。少なくとも`dependencies`からの除去候補。 |
| `@types/express` | NO x0 | 保持妥当 | `express`利用があり型パッケージとして妥当。 |
| `@types/jest` | NO x0 | 保持妥当 | `jest`ベースのテスト構成（`package.json:12`）に対する型定義。 |
| `@types/kuromoji` | NO x0 | 保持妥当 | `kuromoji`利用コードに対する型定義。 |
| `@types/node` | NO x0 | 保持妥当 | Node/ts-node運用前提の型定義。 |
| `@types/react` | NO x0 | 保持妥当 | React importあり（`src/components/LoginForm.tsx:1`）。 |
| `@types/supertest` | NO x0 | 保持妥当 | `supertest`利用テスト（`src/app.test.ts:1`）に対応。 |
| `@typescript-eslint/eslint-plugin` | NO x0 | 保持妥当 | ESLint設定で利用（`.eslintrc.json:21`）。 |
| `@typescript-eslint/parser` | NO x0 | 保持妥当 | ESLint設定で利用（`.eslintrc.json:17`）。 |
| `eslint` | NO x0 | 保持妥当 | npm scriptsで利用（`package.json:29`）。 |
| `jest` | NO x0 | 保持妥当 | npm scripts/Jest設定で利用（`package.json:12`, `jest.config.js:2`）。 |
| `nodemon` | NO x0 | 保持妥当 | 開発スクリプトで利用（`package.json:11`）。 |
| `playwright-core` | YES x4 (`tests/unit/playwright-cdp.test.ts:47`) | 保持妥当 | 実importあり。 |
| `supertest` | YES x1 (`src/app.test.ts:1`) | 保持妥当 | 実importあり。 |
| `ts-jest` | NO x0 | 保持妥当 | Jest presetで利用（`jest.config.js:2`）。 |
| `ts-node` | NO x0 | 保持妥当 | npm scriptsで利用（`package.json:35`）。 |
| `tsx` | NO x0 | 保持妥当 | npm scriptsで利用（`package.json:72`）。 |
| `typedoc` | NO x0 | 保持妥当 | docs生成スクリプトで利用（`package.json:33`）。 |
| `typescript` | NO x0 | 保持妥当 | `tsc`系スクリプトで利用（`package.json:31`）。 |

## Category 4: Orphan files
| path:line | 要素数 | 影響範囲 | 判定 | 理由 |
|---|---:|---|---|---|
| `docs/research-knowledge-scaling/agent-a-official-docs.md:1` | 9 files | 研究メモ群（約1,044KB） | 削除推奨 | `grep -r`で各対象パス参照0件（path_refs=0）を確認。運用コードから孤立。 |
| `udemy-downloader/README.md:1` | 1 file | 外部プロジェクト文書 | 削除推奨 | `grep -r`でパス参照0件。TAISUN本体から孤立。 |
| `udemy-downloader/requirements.txt:1` | 1 file | 外部依存定義 | 削除推奨 | `grep -r`でパス参照0件。TAISUN本体から孤立。 |
| `udemy-downloader/temp/index_10150072.m3u8:1` | 6,340 files | 一時m3u8成果物（約262,880KB） | 削除推奨 | `grep -r`でパス参照0件。生成キャッシュで孤立。 |

該当なし: なし

## Category 5: Duplicate code
| path:line | 要素数 | 影響範囲 | 判定 | 理由 |
|---|---:|---|---|---|
| `src/i18n/index.js:1` | 2 files (`index.js` + `index.ts`) | 同一i18nロジックの二重保持 | 削除推奨 | `src`配下にTSソースとトランスパイル済JSが共存。`dist`生成運用と重複。 |
| `.claude/commands/-todos.md:1` | 2 files (`/`) | 文面ほぼ同一のコマンド定義 | 保持妥当 | 差分はコマンド名前空間（`__todos`/`__todos`）で、意図的な別名提供。 |
| `scripts/update-settings.js:24` | 2 files (`scripts` + `src/utils`) | mergeロジック重複 | 保持妥当 | `update-settings.js`に「`src/utils/settings-merge.ts`をミラー」と明記。スタンドアロン実行要件あり。 |

該当なし: なし

## Category 6: Experimental / dead code
| path:line | 要素数 | 影響範囲 | 判定 | 理由 |
|---|---:|---|---|---|
| `src/proxy-mcp/router/semantic.ts:22` | 4 lines (22-25,39) | コメントアウト済み補助ロジック | 保持妥当 | 「将来のembedding類似度用」と注記があり、現行挙動へ影響なし。 |
| `scripts/mistake-to-test.ts:107` | 2 TODO blocks (107,119) | 生成される回帰テスト雛形 | 保持妥当 | 生成テンプレートとして意図的にTODO/placeholderを残す実装。 |

該当なし: 削除推奨対象なし

## Category 7: Should-not-be-in-repo files
| path:line | 要素数 | 影響範囲 | 判定 | 理由 |
|---|---:|---|---|---|
| `.DS_Store:1` | 6 files | Finderメタデータ（56KB） | 削除推奨 | OS生成物。`.gitignore:33`対象。 |
| `.env:1` | 1 file | 機密設定（4KB） | 保持妥当 | ローカル実行には必要。`.gitignore:5`で追跡除外されているためコミット禁止を維持。 |
| `udemy-downloader/.venv/bin/pip:1` | 5,348 files | Python仮想環境（100,844KB） | 削除推奨 | 外部プロジェクト依存のローカル生成物。`.gitignore`対象。 |
| `udemy-downloader/__pycache__/main.cpython-312.pyc:1` | 7 files | Python bytecode cache（140KB） | 削除推奨 | 実行時生成物。再生成可能。 |
| `udemy-downloader/logs/2026-04-16-11-18-33.log:1` | 37 files | 実行ログ（13,284KB） | 削除推奨 | ログは成果物ではなく観測データ。 |
| `udemy-downloader/.git/HEAD:1` | 28 files | ネストGitメタデータ（668KB） | 削除推奨 | 外部リポジトリ混入。TAISUN本体の単一Git管理を汚染。 |
| `.playwright-mcp/console-2026-03-12T12-17-23-602Z.log:1` | 21 files | Playwrightログ（1,148KB） | 削除推奨 | ツール実行ログ。`.gitignore:140`対象。 |
| `.claude/skills/nanobanana-pro/data/browser_profile/Default/Local Storage/leveldb/000003.log:1` | 2,375 files | ブラウザプロファイルキャッシュ（313,796KB） | 削除推奨 | キャッシュ/セッションデータで本体ソースではない。 |
| `dist/proxy-mcp/workflow/store.js:1` | 218 files | ビルド成果物（1,560KB） | 保持妥当 | `npm`スクリプトが`dist/*`実行前提。未追跡のまま運用するなら妥当。 |

該当なし: なし

## Recommended Cleanup Actions (優先度順)
1. `udemy-downloader/` をリポジトリ外へ移動し、少なくとも `.venv/`, `temp/`, `logs/`, `.git/`, `__pycache__/` を即時削除。
2. `docs/research-knowledge-scaling/` の孤立9ファイルと `.claude/commands/kindle-*.md` を整理（不要なら削除、必要なら`archived/`へ移管）。
3. バックアップ残骸（`.claude/*.backup*`, `.bak.*`, `LOG.old`）を世代ポリシー化し、現行1世代のみ残す。
4. `src/i18n/index.js` を削除し、`src/i18n/index.ts` + `dist/`生成物に一本化。
5. `@prisma/client` の用途を再確認し、未使用なら削除（または役割に応じて依存区分を見直し）。
6. `.DS_Store` とツールログ（`.playwright-mcp/*.log` 等）を定期クリーンアップ対象に追加。

## Verification Log
- 実行したコマンド一覧（再現可能な形）
- `git status --short`
- `git status --porcelain=v1 --untracked-files=all`
- `find . -path './.git' -prune -o -path './node_modules' -prune -o -type f \( -name '*.bak' -o -name '*.old' -o -name '*~' -o -name '*.backup' -o -name '*.bak.*' \) -print | sort`
- `find . -path './.git' -prune -o -path './node_modules' -prune -o -type f \( -name '.DS_Store' -o -name '*.log' -o -name '.env' -o -name '.env.*' \) -print | sort`
- `node -e "const p=require('./package.json'); ..."`（dependencies/devDependencies列挙）
- `grep -rEn --include='*.ts' --include='*.js' --include='*.tsx' --include='*.jsx' --include='*.mjs' --include='*.cjs' "from ['\"]PACKAGE['\"]|require\(['\"]PACKAGE" .`（PACKAGEを全依存に展開して実行）
- `rg -n --hidden -g '!.git' -g '!node_modules' -F '<package>' ...`（NO判定依存の補助確認）
- `grep -rE --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=docs/research-knowledge-scaling --exclude-dir=udemy-downloader '<candidate-path>' . | wc -l`（孤立候補の参照0確認）
- `rg -n '^(export\s+)?(async\s+)?function\s+...' src scripts mcp-servers tests | ...`（重複関数候補抽出）
- `diff -u .claude/commands/-todos.md .claude/commands/-todos.md`
- `rg -n '(TODO|FIXME|HACK|XXX)' src scripts tests mcp-servers .claude`
- `du -sk <target>` と `find <target> -type f | wc -l`（影響規模算出）
- `git check-ignore -v <path>`（除外ルール確認）

