# Round 11 / UX / Codex Pro

## 実測ログ
- `ls -la | wc -l`
  - 出力:
```text
      67
```
- `awk 'NR==24{print length}' README.md`
  - 出力:
```text
2295
```
- `ls .env*.example`
  - 出力:
```text
.env.example
.env.ops.example
.env.tools.example
```
- `ls -1 | rg '^docker-compose.*\.ya?ml$' | wc -l`
  - 出力:
```text
       5
```
- `ls -d debate* 2>/dev/null | wc -l`
  - 出力:
```text
       4
```
- `rg '^\| v' README.md | wc -l`
  - 出力:
```text
      33
```
- `rg -n '^## ' README.md | head -n 3`
  - 出力:
```text
18:## 📋 最新バージョン
63:## 🚀 インストール（5分）
163:## 🛠 インストール後に使えるコマンド
```
- `awk 'NR>=18&&NR<63{n++} END{print n}' README.md`
  - 出力:
```text
45
```
- `ls -1 docker-compose*.yml docker-compose*.yaml 2>/dev/null`
  - 出力(失敗):
```text
zsh:1: no matches found: docker-compose*.yaml
```

## Findings
### UX-C01
Severity: High
Title: ルート導線が過密で初見の選択コストが高い
実測: `ls -la | wc -l` => `67` / `ls -1 | rg '^docker-compose.*\.ya?ml$' | wc -l` => `5` / `ls -d debate* 2>/dev/null | wc -l` => `4`
問題: repo root に似た用途の入口が多く、初回訪問時に「最初に実行すべき場所」が即決しにくい。
改善案: 初回導線を `README` + `docs/getting-started` に一本化し、`debate*` や compose 系は目的別サブディレクトリへ整理する。

### UX-C02
Severity: Medium
Title: env テンプレートの選択基準が見えない
実測: `ls .env*.example` => `.env.example / .env.ops.example / .env.tools.example`
問題: 3つのテンプレートが並列で提示され、初回ユーザーが「どれをコピーすべきか」を判断しづらい。
改善案: `env templates matrix` を README 冒頭に追加し、用途・必須度・最小構成の1枚表で選択手順を先に示す。

### UX-C03
Severity: Medium
Title: README 24行目が長大でスキャン性を壊す
実測: `awk 'NR==24{print length}' README.md` => `2295`
問題: 単一行に詳細を詰め込みすぎて、モバイルや narrow 画面で視線移動が増え、重要語の拾い読みが困難。
改善案: v2.53.3の詳細は `CHANGELOG.md` へ移し、README 側は 3-5 bullet の要約 + リンクに分離する。

### UX-C04
Severity: Medium
Title: インストール情報より更新履歴が先に強く出る
実測: `rg -n '^## ' README.md | head -n 3` でインストール見出しは `63` 行目 / `awk 'NR>=18&&NR<63{n++} END{print n}' README.md` => `45` / `rg '^\| v' README.md | wc -l` => `33`
問題: 初回ユーザーは導入手順より前に長い更新履歴を読むことになり、タスク到達までの認知負荷が増える。
改善案: 先頭を「3ステップ導入」にし、更新履歴は折りたたみまたは別章へ後置する。
