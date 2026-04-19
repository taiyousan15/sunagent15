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
node scripts/check-skill-requirements.js              # default: requires: 不在は skip
node scripts/check-skill-requirements.js --strict     # 全スキルに requires: 必須
node scripts/check-skill-requirements.js --verbose    # 詳細出力
```

### 判定ルール

| ケース | 終了コード |
|--------|-----------|
| 全スキル validator pass | `0` |
| `requires:` の型/書式違反 | `1` |
| `--strict` モードで `requires:` 欠損 | `1` |
| frontmatter パースエラー | `1` |

---

## CI Enforcement

`.github/workflows/ci.yml` に `skill-requirements-check` ジョブを追加。

- トリガー: `.claude/**` または `scripts/**` または `.github/workflows/**` 変更時
- 失敗すると Quality Gate が fail
- デフォルトは non-strict（段階的導入を許容）

---

## 段階的ロールアウト

1. **Phase 1 (本 PR)**: schema + validator + CI + 全 67 スキル棚卸し（L-full）
   - Group A (外部依存あり): 明示的に `requires: {tools: [...], env: [...], node: ...}` 記入
   - Group B (依存なし): `requires: {}` で "依存なし" を明示宣言（書き忘れと区別）
2. **Phase 2 (次 PR)**: `scripts/check-skill-requirements.js --strict` を CI default 化
   - 全スキルに `requires:` フィールドが必須
   - 新規スキル追加時の記入漏れを CI で検出
   - Phase 1 完了後に切り替え（empty mapping も OK、フィールド自体の存在は必須）

新スキル追加時は `requires: {...}` または `requires: {}` を最初から記入することを推奨。
