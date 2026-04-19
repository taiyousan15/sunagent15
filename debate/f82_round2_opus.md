# F8.2 Round 2: アーキテクチャ — Opus Analysis

観点: 既存 frontmatter との共存、67スキル全量記入の妥当性、責務分割

## Finding 2-1
**Issue**: 既存 `dependencies: [taiyo-analyzer]` (skill間依存) と 新設 `requires:` (外部依存) は意味が異なるが、命名が近接しユーザー混乱を招く。また新規 `requires:` が optional なのに既存 `dependencies:` が optional か mandatory かも未定義。docs/SKILL_REQUIRES_SCHEMA.md には `dependencies:` の扱いを明記していない。
**Evidence**: .claude/skills/taiyo-style-headline/SKILL.md L8 `dependencies: [taiyo-analyzer]` / docs/SKILL_REQUIRES_SCHEMA.md は requires のみ記述
**Category**: architecture
**Severity**: medium
**Proposed fix**: docs/SKILL_REQUIRES_SCHEMA.md に "§既存 `dependencies:` との違い" テーブルを追加（既に記述済、確認不足）。さらに将来の名称統一（例: `requires.skills:`）を roadmap に書く。

## Finding 2-2
**Issue**: L-full (全67記入) は 25 件の「外部依存ゼロ」スキル（taiyo-style-*, story-pattern-*, lp-* 系）に `requires:` を**空マッピング** `{}` で書くか、省略するかの方針が未定。空マッピングは schema 的に valid だが、YAML では `requires: {}` になり冗長。省略だと「未記入」と区別つかない。
**Evidence**: grep scan 結果 25件 は tools/env 共に検出ゼロ
**Category**: architecture
**Severity**: high
**Proposed fix**: 内部処理のみスキルには `requires: {}` を明示的に書く（="依存なし"宣言）。validator は空マッピングを pass とし、欠損は --strict でのみ fail。これで「書き忘れ」と「依存なし」を区別できる。

## Finding 2-3
**Issue**: scripts/check-skill-requirements.js の listSkillFiles() が `_` で始まるディレクトリを除外する実装は、`_archived` を意図しているが、他に `_backup` `_tmp` 等が将来できた時に予期せず除外される。命名規約として明確でない。
**Evidence**: scripts/check-skill-requirements.js listSkillFiles() L47-48
**Category**: code
**Severity**: low
**Proposed fix**: 除外リストを `EXCLUDED_DIRS = ['_archived']` として明示化。他の `_`-prefix ディレクトリは警告して include するか、docs/SKILL_REQUIRES_SCHEMA.md に除外規約を書く。
