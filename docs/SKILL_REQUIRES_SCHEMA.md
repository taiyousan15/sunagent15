# Skill Requires Schema (F8.2)

SKILL.md frontmatter に記述する外部リソース依存の統一スキーマ。

**根拠**: `debate/codex_15rounds_response.md:38` — "no uniform `requires` schema for external binaries plus CI enforcement across all skills"

---

## スコープ

- **対象**: `.claude/skills/<skill-name>/SKILL.md`（top-level 67 スキル）
- **非対象**: `.claude/skills/_archived/**/*` (レガシー)
- **除外規約**: validator は `EXCLUDED_DIRS = ['_archived', '_guides']` に一致するディレクトリのみ除外する（`_guides` はドキュメント集約用、SKILL.md を持たない）。他の `_`-prefix ディレクトリは **include + 警告**。新たに除外が必要な場合は validator コードと本 docs を同時更新すること。

---

## フィールド仕様

スキル固有 frontmatter に optional な `requires:` ブロックを追加する。

```yaml
---
name: video-download
description: YouTube等から動画をダウンロード
allowed-tools: Read, Write, Bash(yt-dlp:*, ffmpeg:*)

requires:
  node: ">=18"
  tools:
    - yt-dlp
    - ffmpeg
  env:
    - YOUTUBE_API_KEY
---
```

### `requires.node` (optional, string)
- Node.js 最小バージョンの SemVer 範囲式
- 書式: `>=18`, `^20.5.0`, `~18.19` 等（`semver.validRange` でパース可能なもの）
- スキルが Node.js に依存しない場合は省略

### `requires.tools` (optional, string array)
- 外部 CLI / バイナリの名前
- 書式: 小文字英数字・ハイフン・アンダースコアのみ (`^[a-z0-9][a-z0-9._-]*$`)
- 例: `ffmpeg`, `yt-dlp`, `whisper`, `python3`, `docker`, `trivy`
- **NG**: `node`, `npm`, `npx` は書かない（Node.js バージョン要件は `requires.node` に寄せる）
- **NG**: 内部 npm モジュールや Node スクリプト (`scripts/xxx.js`) もここに書かない

### `requires.env` (optional, array of string or object)
- 実行時に必要な環境変数名
- 書式:
  - **短縮形 (string)**: `"OPENAI_API_KEY"` — 必須 env として扱う
  - **詳細形 (object)**: `{name: "SERPAPI_KEY", required: false}` — optional fallback として明示
- name 制約: UPPER_SNAKE_CASE (`^[A-Z][A-Z0-9_]*$`)
- 例:
  ```yaml
  requires:
    env:
      - OPENAI_API_KEY              # 必須
      - name: SERPAPI_KEY
        required: false             # optional (fallback 候補など)
  ```
- `CLAUDE_*` など Claude Code 側で自動提供される変数は省略して良い

### セキュリティ note: 宣言 ≠ 権限
- `requires.env` は **「スキルがこの env を必要とする」宣言** であり、Claude Code ランタイムが値を自動的に渡す契約ではない
- スキル実行側は `process.env.XXX` 等で明示的に読み出す
- `GITHUB_TOKEN`, `AWS_SECRET_ACCESS_KEY`, `GCP_*`, `AZURE_*` 等のプラットフォーム埋込系を宣言する場合、validator が警告を出す（機密の不用意な暴露を抑止）

---

## 既存 `dependencies:` との違い

| フィールド | 対象 | 例 |
|-----------|------|-----|
| `dependencies:` | **スキル間依存**（他 SKILL.md を呼ぶ） | `[taiyo-analyzer]` |
| `requires:` | **外部リソース依存**（Node / CLI / env） | `{node: ">=18", tools: [ffmpeg]}` |

両者は独立して並立する。既存 `dependencies:` は据え置き、`requires:` を新設する。

---

## 検証方法

```bash
node scripts/check-skill-requirements.js               # strict (default, F8.2 Phase 2 以降)
node scripts/check-skill-requirements.js --non-strict  # 移行期用: requires: 欠落を許容
node scripts/check-skill-requirements.js --verbose     # 詳細出力
```

`--strict` は後方互換のため引き続き解釈されるが、**deprecated**（既定が strict のため実質 no-op）。渡すと警告が出る。将来のリリースで削除予定。

### ファイル名規約（F8.2 Phase 2 Cleanup 以降）

- スキルの定義ファイルは **`SKILL.md` 固定**（大文字）。
- lowercase `skill.md` は **hard error**。macOS の case-insensitive FS でも検出される。
- `SKILL.md` と `skill.md` が同一ディレクトリに両方存在する場合も error。

### 判定ルール

| ケース | 終了コード |
|--------|-----------|
| 全スキル validator pass | `0` |
| `requires:` の型/書式違反 | `1` |
| `requires:` 欠落（strict 既定） | `1` |
| `--non-strict` 指定時に `requires:` 欠落 | `0`（skip、ただし CI では原則使用しない） |
| frontmatter パースエラー | `1` |
| lowercase `skill.md` または SKILL.md/skill.md 併存 | `1` |

---

## CI Enforcement

`.github/workflows/ci.yml` に `skill-requirements-check` ジョブを配置。

- トリガー: `.claude/skills/*/SKILL.md` / `scripts/check-skill-requirements.js` / `docs/SKILL_REQUIRES_SCHEMA.md` の変更時
- 実行コマンド: `node scripts/check-skill-requirements.js --github-summary`
- 失敗すると Quality Gate が fail
- 既定は strict（`requires:` フィールドの存在自体を必須、Phase 2 完了済）
- `--strict` フラグは渡さない（deprecated、既定と同じ挙動）

---

## 段階的ロールアウト

1. **Phase 1** (PR #325, main `481438a`): schema + validator + CI + 全 67 スキル棚卸し
   - Group A (外部依存あり): 明示的に `requires: {tools: [...], env: [...], node: ...}` 記入
   - Group B (依存なし): `requires: {}` で「依存なし」を明示宣言（書き忘れと区別）
2. **Phase 2** (PR #327, main `fe771bc`): validator と CI を strict 既定化
   - 全スキルに `requires:` フィールドが必須（empty mapping `{}` も OK）
   - 新規スキル追加時の記入漏れを CI で即検出
   - `--non-strict` は移行期用のエスケープハッチとして残置、CI では使用しない
   - lowercase `skill.md` は `SKILL.md` へリネーム済（PR #326、main `92227006`）。その時点では validator は警告を維持
   - validator の jest 単体テスト 36 ケースを追加（PR #328、main `14306c9`）
3. **Phase 2 Cleanup** (本 PR): 仕上げ
   - lowercase `skill.md` 検出を **hard error** に昇格（PR #326 リネーム後で安全）
   - `SKILL.md`/`skill.md` が同一ディレクトリに併存した場合も hard error
   - `--strict` フラグを **deprecated** 化（渡すと警告、将来のリリースで削除）
   - CI ジョブから `--strict` を除去（deprecation 警告 noise 回避）

新スキル追加時は `requires: {...}` または `requires: {}` を最初から記入すること（Phase 2 以降は CI が即座に検出する）。**ファイル名は `SKILL.md`（大文字）固定**。
