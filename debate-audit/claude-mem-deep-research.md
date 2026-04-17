# claude-mem 深層リサーチレポート

調査日: 2026-04-17
対象: github.com/thedotmack/claude-mem (v12.1.6 / 60.3k stars / 5k forks)
WebFetch実施: 10件（GitHub README、Issue #1251/#707/#1110/#791/#692、docs.claude-mem.ai、deepwiki、augmentcode、dev.to）

---

## 問いの再定義

「claude-memは導入に値するか？」という問いを以下の8軸で検証する。
各軸に証拠を付与し、未確認主張は明示する。

---

## 1. アーキテクチャ詳細

出典: deepwiki.com/thedotmack/claude-mem/1-overview (WebFetch 200 確認済み)

**デュアルDB構成:**
- SQLite (`~/.claude-mem/claude-mem.db`) — sessions / observations / pending_messages テーブル。FTS5仮想テーブル `observations_fts` で全文検索
- ChromaDB (`~/.claude-mem/vector-db`) — HNSW インデックスによるセマンティック検索

**ライフサイクルフック (6本):** SessionStart / UserPromptSubmit / PostToolUse / Summary / Stop / SessionEnd

**Workerサービス:** Bun管理、ポート37777、HTTP API 30+エンドポイント + Web UI

**データフロー:**
1. PostToolUse → 観測をSQLiteキューに書き込み（fire-and-forget）
2. Workerが非同期でAIプロバイダーへ送りサマリー圧縮
3. SessionStart → SQLiteクエリでMEMORY.mdを組み立て
4. MEMORY.mdを新セッションのコンテキストへ注入

**埋め込みモデル:** chromadb-js-bindings経由（ONNX）、モデル名は未公開ドキュメント

---

## 2. 実際のユーザーレビュー

出典: HN #46429613 (WebFetch 200)、dev.to/kanta13jp1 (WebFetch 200)、GitHub Issues 各種

**肯定的評価:**
- 48時間で46kスター獲得（爆発的採用）
- セマンティック検索付きWeb UIは「手動スクリプトで再現困難な本物の機能」(dev.to著者)
- `npx claude-mem install` 一発セットアップ

**批判的評価:**
- HN #46429613は投稿者コメントのみ、ユーザー討論は確認できず（内容薄）
- dev.to著者は「Geminiへの切り替えを推奨、デフォルトでClaude APIトークンを消費」と警告
- 「シンプルにCLAUDE.mdを管理するだけで80%の要件を満たせる」— 複雑さへの批判
- 46k → 60kスターに達しているが、実稼働ユーザー数・ダウンロード数は非公開

---

## 3. 実測ベンチマーク（10x savings）

出典: docs.claude-mem.ai/usage/search-tools (WebSearch確認)、augmentcode.com (WebFetch 200)

**公称値:** 3層MCP検索フロー（search → timeline → get_observations）で「約10x トークン節約」
- 具体例: 全観測フェッチ時 10,000〜20,000 tokens → フィルタ後取得 2,500〜4,000 tokens

**独立検証:** 存在しない。
augmentcode.com記事（Augment Code社のDeveloper Evangelist著）はベンチマーク手法・再現条件なしで同数値を引用するのみ。自己申告値であることを明記する。

---

## 4. 欠陥・バグ・メンテナンス状況

出典: GitHub Issues #707/#1110/#791/#692 (各WebFetch 200確認済み)

| Issue | 内容 | 深刻度 | 状態 |
|-------|------|--------|------|
| #707 | ChromaDB が macOS Apple Silicon で 35GB RAM消費 | Critical | Open (2026-01-14) |
| #1110 | Linux で ChromaDB がexit 139 (SIGSEGV) → HNSW破壊 | High | Open (2026-02-15) |
| #791 | Windows v9.0.6 FTS5検索が全件 "No results" | Medium | Open (未解決) |
| #692 | フック未実行 (2026-01-09〜) — 新規観測ゼロ | Medium | Closed (root cause 不明) |

**最終コミット日:** v12.1.6 リリース 2026-04-16（調査前日）— アクティブ開発中
**総コミット数:** 1,727件 / リリース数: 223件

---

## 5. アンインストール手順

出典: docs.claude-mem.ai/troubleshooting (WebFetch 200)、Issue #659 (WebFetch 200)

**公式手順 (推定):**
1. `/plugin uninstall claude-mem` (Claude Code内)
2. `rm -rf ~/.claude/plugins/marketplaces/thedotmack/`
3. `rm -rf ~/.claude-mem/` (DB・ベクトルインデックス・ログ全削除)

注意: 公式ドキュメントにアンインストール専用ページは存在しない（troubleshootingページから推測）。

**個別メモリ削除:** Issue #659 は「Closed as not planned」。UI削除機能は実装されておらず、現状の削除手段は手動SQLコマンドのみ。

---

## 6. Claude Code との互換性

出典: docs.claude-mem.ai/troubleshooting (WebFetch 200)

- v5.x系Claude Codeへの言及あり、それ以前との互換性は未記述
- Node.js >= 18.0.0、Python 3.8+ (ChromaDB用) が前提
- Issue #692: 2026-01-09 以降にフック実行が止まる事例あり → Claude Code 側のフック仕様変更が疑われるが根本原因は未特定
- Windows環境でFTS5が動作しない既知バグあり（Issue #791 未解決）

---

## 7. プライバシー懸念

出典: GitHub Issue #1251 Security Audit (WebFetch 200確認済み)

**セキュリティ監査 (v10.5.2, 外部提出) の主要所見:**

- **C-1 (Critical):** パストラバーサル — `smart_unfold`/`smart_outline` でSSHキーなど任意ファイル読み取り可
- **C-2 (Critical):** ポート37777の全エンドポイントが無認証。`GET /api/settings` でAPIキーが平文返却。メモリポイズニング（偽記憶注入）も可能
- **C-3 (Critical):** `0.0.0.0` バインディング設定が存在 → 共有環境でネットワーク全体に露出
- **C-4 (Critical):** 設定エンドポイントがAPIキーをマスキングなしで返す

**ローカル完結か？** 基本動作はローカルのみ。ただし圧縮処理はAnthropicまたはGemini APIに観測データを送信する（コーディングセッション内容がクラウドへ送られる）。セッションデータにAPIキー・パスワード・プロプライエタリコードが含まれる場合、それらも送信対象となる。

---

## 8. パフォーマンス

出典: Issue #707/#1110 (WebFetch 200)、検索結果 (WebSearch確認)

**ChromaDB (デフォルト設定):**
- macOS Apple Silicon: 35GB+ RAM消費事例あり（Issue #707 Open）
- Linux: exit 139 セグフォルト、HNSWインデックス破損事例あり（Issue #1110 Open）
- 初回インデックス構築時間: 公式ベンチマークなし

**SQLite-only モード（非公式回避策）:**
- RAM消費 ~50MB（Chroma比で約700倍差）
- セマンティック検索は失われFTS5のみ
- 設定: `~/.claude-mem/settings.json` に `{"backend":"sqlite"}` — 公式ドキュメント未記載

**FTS5 検索レイテンシ:** 公式データなし。直接SQL呼び出しは動作するがAPI層でWindowsのみ不具合あり。

---

## 結論

claude-memは「Claude Codeセッション横断の自動記憶」という明確なユースケースを持つツールであり、60k+ スターと活発な開発（前日にv12.1.6）が示す通り採用は広がっている。しかし以下の重大リスクが未解決のまま存在する。

1. **Chromaデフォルトは使用リスク大** — macOS 35GB RAM、Linux segfault は本番環境での利用を妨げる
2. **セキュリティ設計が根本的に不備** — 無認証API + APIキー平文返却はゼロトラスト環境では受け入れ不可
3. **10x節約は自己申告** — 独立検証なし、採用判断の根拠にできない
4. **個別メモリ削除が不可** — プロプライエタリコード・パスワードを誤記録しても削除困難

---

## 重要ポイント

- SQLite-only モード (`{"backend":"sqlite"}`) を設定すればRAM問題は回避できるが公式未記載
- セキュリティ懸念が許容できる場合は `--host localhost` (デフォルト) で利用範囲を限定する
- 代替案: memsearch（ゼロ依存・マークダウンファイル）が軽量代替として有力
- アンインストールは `rm -rf ~/.claude-mem/` で完全削除可能（Hook設定は別途除去要）

---

## 未解決・追加調査項目

1. Issue #1251 (Security Audit) に対する開発者の修正状況 → v12.1.6 時点で未確認
2. HN #46229436 の討論内容（rate limit 429 で取得不可）
3. SQLite-only モードが公式化された時期・バージョン
4. 圧縮時のAnthropicへのデータ送信内容の詳細（プロンプトのどの部分が送られるか）
5. Issue #692 (フック未実行) のroot cause — Claude Code側のAPI変更との相関

---

*調査済みURL一覧（全件WebFetch 200確認または明示的エラー記録）:*
- https://github.com/thedotmack/claude-mem (200)
- https://github.com/thedotmack/claude-mem/issues/1251 (200)
- https://github.com/thedotmack/claude-mem/issues/707 (200)
- https://github.com/thedotmack/claude-mem/issues/1110 (200)
- https://github.com/thedotmack/claude-mem/issues/791 (200)
- https://github.com/thedotmack/claude-mem/issues/692 (200)
- https://docs.claude-mem.ai/troubleshooting (200)
- https://github.com/thedotmack/claude-mem/issues/659 (200)
- https://deepwiki.com/thedotmack/claude-mem/1-overview (200)
- https://www.augmentcode.com/learn/claude-mem-46k-stars-persistent-memory-claude-code (200)
- https://dev.to/kanta13jp1/adding-persistent-memory-to-claude-code-with-claude-mem-plus-a-diy-lightweight-alternative-4gha (200)
- https://news.ycombinator.com/item?id=46429613 (200、コメント1件のみ)
- https://news.ycombinator.com/item?id=46229436 (429 rate limit — 取得不可、記録済み)
- https://www.mintlify.com/thedotmack/claude-mem/architecture/database (410 Gone — 記録済み)
