# AI Guardrails: mario-game

**System Name**: mario-game (マリオ風2Dプラットフォーマー)
**Classification**: Public
**Compliance**: N/A (教育用途・パブリックブラウザゲーム)
**Review Date**: 2026-03-20
**Author**: Security Architect
**対象**: Claude Code による AI 支援開発全フェーズ

---

## 概要

本ドキュメントは、Claude Code を用いた AI 支援開発において AI エージェントが遵守すべき操作制限・承認ゲート・監査要件を定義する。threat-model.md で特定された 15 脅威（T-01 〜 T-15）および Phase 3 追加脅威（T-P3-01 〜 T-P3-05）の緩和策と対応させ、開発プロセス全体に防御を組み込む。

---

## 1. 権限境界定義

AI エージェント（Claude Code）が実行できる操作を 3 段階に分類する。各操作は以下の権限レベルを明示的に確認してから実行する。

### 1.1 Read-Only（AI が自由に実行可能）

| 操作 | 対象 | 備考 |
|------|------|------|
| ソースコード読み込み | `src/**/*.ts`, `*.config.*` | 閲覧のみ |
| ゲーム状態の参照 | `PlayerState`, `GameState`, `SceneManager` | 読み取り専用アクセス |
| アセット読み込み | `assets/maps/*.json`, `assets/sprites/**`, `assets/audio/**` | バンドル前のみ |
| テスト実行（読み取り） | `tests/**/*.test.ts` | Vitest 実行、変更なし |
| 設定ファイル参照 | `vite.config.ts`, `tsconfig.json`, `package.json` | 変更には Write 権限が必要 |
| スキーマ定義参照 | `src/models/*.ts`, Zod スキーマ定義 | 読み取りのみ |
| ビルド成果物の確認 | `dist/` ディレクトリ | 変更不可 |
| ログ・エラー出力の確認 | CI/CD ログ | 閲覧のみ |

### 1.2 Write（AI が実行可能だがログ必須）

| 操作 | 対象 | 制約 |
|------|------|------|
| ソースコード変更 | `src/**/*.ts` | テスト同時変更必須（後述 §3.2） |
| セーブデータ書き込み（開発環境） | `localStorage`（dev 環境） | スキーマ検証済みデータのみ |
| レベルエディタデータ保存（開発） | `assets/maps/*.json` | Tiled JSON スキーマ検証通過後のみ |
| テストファイル変更 | `tests/**/*.test.ts` | 新規追加または既存テスト修正 |
| 設定ファイル変更（非セキュリティ） | `vite.config.ts`（sourcemap, fps 等） | セキュリティ設定変更は Admin 権限 |
| 依存関係変更（マイナーバージョン） | `package.json` | npm audit 通過後のみ |
| CI ワークフロー変更（非デプロイ） | `.github/workflows/ci.yml` | デプロイステップ追加は Admin 権限 |

### 1.3 Admin（Human-in-the-Loop 必須）

| 操作 | 承認者 | 理由 |
|------|--------|------|
| 本番デプロイ実行 | セミナー主催者 | T-06: CDN 静的ファイル改ざんリスク |
| CSP ヘッダー変更 | Security Architect | T-06, T-07: サプライチェーン攻撃防御の根幹 |
| SRI ハッシュ設定変更 | Security Architect | T-06: CDN ファイル整合性の根幹 |
| npm メジャー/セキュリティパッチ適用 | 開発リーダー | T-07: npm サプライチェーン攻撃リスク |
| Vite sourcemap 設定変更（本番） | Security Architect | T-09: ソースコード露出リスク |
| Vite console.drop 設定変更 | Security Architect | T-10: 内部情報露出リスク |
| HMAC シークレット変更 | Security Architect | T-03: SaveData チェックサム検証の根幹 |
| GitHub Secrets / 環境変数変更 | セミナー主催者 | 認証情報の保護 |
| Phase 3 WebSocket サーバー設定 | Security Architect | T-P3-01 〜 T-P3-05: マルチプレイ全脅威 |
| Colyseus JWT 設定変更 | Security Architect | T-P3-01: プレイヤー ID 偽装防止 |

---

## 2. Human-in-the-Loop ゲート

AI エージェントは以下のゲートに到達した場合、**必ず処理を停止し人間の承認を要求する**。承認なしに先に進むことは禁止する。

### Gate-01: デプロイ前承認

**トリガー**: 本番環境（GitHub Pages / Vercel）へのデプロイコマンドが発行される直前

**確認項目**:
- [ ] SAST スキャン（ESLint Security Plugin）が High 0 件であること
- [ ] SCA スキャン（npm audit / Snyk）が Critical CVE 0 件であること
- [ ] CSP 評価 Grade A（securityheaders.com）を確認済みであること
- [ ] Vite 本番ビルドで `sourcemap: false` が設定されていること
- [ ] Vite 本番ビルドで `drop: ['console']` が設定されていること
- [ ] SRI ハッシュが `index.html` に付与されていること
- [ ] 単体テストカバレッジが 80% 以上であること（SM-004）
- [ ] TypeScript コンパイルエラーが 0 件であること（SM-003）

**承認者**: セミナー主催者
**対応 THREAT-ID**: T-06, T-07, T-09, T-10
**対応 REQ-SEC**: REQ-SEC-006, 007, 008, 010, 011

---

### Gate-02: ユーザー生成コンテンツ（レベルエディタ）審査

**トリガー**: Tiled JSON マップデータが新規作成・変更されリポジトリにコミットされる前

**確認項目**:
- [ ] Zod スキーマ（`LevelData` スキーマ）の検証が通過していること
- [ ] `itemType` が許可 enum 値（`"coin" | "mushroom" | "fireflower" | "star"`）のみであること
- [ ] `targetStageId` が allowlist（`["1-1", "1-2", "1-3", "1-4"]`）内であること
- [ ] タイル ID が有効な範囲内であること
- [ ] ファイルサイズが 500KB 以下であること（§5.3 入力サイズ制限参照）
- [ ] 手動でゲームが正常起動・クリア可能であることを確認

**承認者**: コードレビュアー
**対応 THREAT-ID**: T-05, T-14, T-15
**対応 REQ-SEC**: REQ-SEC-005, 015, 016

---

### Gate-03: npm パッケージ更新承認

**トリガー**: `package.json` の依存パッケージバージョンが変更される（メジャーバージョンアップまたはセキュリティパッチ）

**確認項目**:
- [ ] `npm audit` が Critical/High 0 件であること
- [ ] Snyk スキャンが通過していること
- [ ] 変更後にすべての単体テストが通過していること
- [ ] `package-lock.json` が同時にコミットされていること（バージョン固定）
- [ ] Phaser または Howler.js のメジャーアップデートの場合、ゲーム動作の手動確認

**承認者**: 開発リーダー（マイナーアップデート）/ Security Architect（メジャー・セキュリティパッチ）
**対応 THREAT-ID**: T-07
**対応 REQ-SEC**: REQ-SEC-008

---

### Gate-04: セキュリティ関連設定変更承認

**トリガー**: 以下のいずれかのファイル・設定が変更される場合
- `vite.config.ts` の `build.sourcemap`, `esbuild.drop`, `build.minify` 設定
- Content Security Policy ヘッダー設定
- SRI ハッシュ生成設定
- HMAC チェックサムシークレット
- Phase 3: JWT シークレット、WebSocket レート制限設定

**確認項目**:
- [ ] 変更理由がコミットメッセージに明記されていること
- [ ] セキュリティへの影響が評価されていること
- [ ] 後退（セキュリティ強度を下げる方向）の変更でないこと、または明示的な許容判断があること

**承認者**: Security Architect
**対応 THREAT-ID**: T-03, T-06, T-07, T-09, T-10, T-P3-01, T-P3-03
**対応 REQ-SEC**: REQ-SEC-003, 007, 008, 010, 011

---

## 3. AI 開発ガードレール（Claude Code 使用時）

### 3.1 コード生成禁止パターン

AI エージェントが生成するコードに以下のパターンが含まれる場合、**即時停止してセキュリティレビューを要求する**。

#### 絶対禁止（CRITICAL — 生成・提案禁止）

| 禁止パターン | 理由 | 代替手段 |
|------------|------|---------|
| `eval(...)` | 任意コード実行の起点 | 静的コードとして実装 |
| `new Function(...)` | eval と同等のリスク | 静的コードとして実装 |
| `innerHTML = userInput` | XSS 攻撃の起点 | `textContent` または DOM API |
| `document.write(...)` | XSS・DOM 破壊リスク | DOM API で要素を生成 |
| `setTimeout(string, ...)` | 文字列の eval と同等 | コールバック関数を渡す |
| `setInterval(string, ...)` | 同上 | コールバック関数を渡す |
| 動的 `import()` への変数代入 | CSP `script-src 'self'` 違反 | 静的インポートを使用 |
| `dangerouslySetInnerHTML` | React 等での XSS | 代替 API を使用 |
| ハードコードされた秘密鍵・トークン | 認証情報の露出 | 環境変数 / GitHub Secrets |

#### 警告必須（HIGH — 生成前に理由を説明してユーザー確認）

| 警告パターン | 理由 | 対応 |
|------------|------|------|
| `localStorage.setItem` 直接呼び出し | SaveData 検証バイパスのリスク | `StorageAdapter` 経由のみ許可 |
| `window[変数名]` グローバル公開 | ゲーム状態の外部アクセス | `Object.freeze()` 適用を確認 |
| `console.log` / `console.debug` | 本番情報露出（T-10） | 開発用デバッグに限定し、PRに含める場合は警告 |
| `as unknown as T` の型アサーション | 型安全性の無効化 | 型ガード関数を使用 |
| `@ts-ignore` / `@ts-nocheck` | 型チェック無効化 | 正しい型定義を実装 |
| ユーザー入力の直接使用（`targetStageId` 等） | Elevation of Privilege リスク | allowlist 検証を必須追加 |
| エンティティ数上限なしのスポーン処理 | DoS リスク（T-12） | `EntityManager` の上限チェックを明示 |

#### 対応 THREAT-ID: T-02, T-03, T-04, T-09, T-10, T-11, T-12, T-14, T-15

---

### 3.2 テスト必須ゲート

AI エージェントがソースコードを変更する場合、**対応するテストの同時変更または新規追加を必須とする**。

**適用ルール**:

| 変更種別 | 必須テスト |
|---------|-----------|
| `SaveManager.ts` / `StorageAdapter.ts` 変更 | `tests/unit/save-manager.test.ts` の更新 |
| `TilemapLoader.ts` 変更 | `tests/unit/tilemap-loader.test.ts` の更新 |
| `EntityManager.ts` 変更 | `tests/unit/entity-manager.test.ts` の更新 |
| `SceneManager.ts` 変更 | `tests/unit/scene-manager.test.ts` の更新 |
| Zod スキーマ変更 | スキーマの正常系・異常系テストの更新 |
| 新規ファイル追加（`src/` 配下） | 対応するテストファイルの新規作成 |
| セキュリティ関連コード変更（REQ-SEC-*） | 対応する REQ-SEC のテストカバレッジ 80% 以上を維持 |

**ゲート判定**: テストなしのコード変更 PR は `BLOCKED` ステータスとし、レビュアーのマージを禁止する。

**対応 THREAT-ID**: T-02, T-03, T-05, T-12, T-13, T-14, T-15
**対応 REQ-SEC**: REQ-SEC-002, 003, 005, 013, 014, 015, 016

---

### 3.3 セキュリティレビュー必須トリガー

以下の状況では、AI エージェントはコード生成を一時停止し、Security Architect によるレビューを要求する。

| トリガー | 理由 |
|---------|------|
| `StorageAdapter.ts` または `SaveManager.ts` の HMAC 検証ロジック変更 | T-03: チェックサム検証の根幹 |
| Zod スキーマの `allowlist` または `enum` 定義の変更 | T-05, T-14, T-15: 不正値注入防止 |
| Phaser 設定（`fps.target`, `delta` クランプ）の変更 | T-11: DoS リスク |
| `EntityManager` の `MAX_ENEMY` / `MAX_ITEM` 定数変更 | T-12: メモリリーク防止 |
| CSP ヘッダー文字列を含むファイルの変更 | T-06: サプライチェーン攻撃防御 |
| Phase 3: JWT 検証ロジックの変更 | T-P3-01, T-P3-03: プレイヤー認証 |
| Phase 3: Anti-Cheat 速度制限値の変更 | T-P3-03: チート検出ロジック |
| Phase 3: WebSocket レート制限の変更 | T-P3-04: DoS 防御 |

**対応 THREAT-ID**: T-03, T-05, T-06, T-11, T-12, T-14, T-15, T-P3-01, T-P3-03, T-P3-04

---

## 4. 監査証跡要件

### 4.1 記録必須イベント

| イベント | 記録場所 | 保持期間 |
|---------|---------|---------|
| コード変更（全 PR） | GitHub PR + コミット履歴 | リポジトリ存続期間 |
| デプロイ実行（本番） | GitHub Actions ログ + デプロイ承認記録 | 90 日以上 |
| npm パッケージ更新 | GitHub PR + `package-lock.json` 差分 | リポジトリ存続期間 |
| セキュリティ設定変更 | GitHub PR + Security ADR | リポジトリ存続期間 |
| Gate-01〜04 の承認 | GitHub PR レビューコメント（承認者・日時記録） | リポジトリ存続期間 |
| SAST/SCA スキャン結果 | GitHub Actions アーティファクト | 30 日 |
| テストカバレッジレポート | GitHub Actions アーティファクト | 30 日 |
| CSP 評価結果 | デプロイ後確認記録（PR コメントまたは issue） | 90 日 |
| Phase 3: WebSocket 異常接続（レート超過・認証失敗） | Colyseus サーバーログ | 30 日 |

### 4.2 監査レコード形式

すべての監査記録に以下の情報を含める。

```
WHO  : 実行者（GitHub ユーザー名 / AI エージェント識別子）
WHAT : 実行した操作（ファイル名・変更内容の概要）
WHEN : タイムスタンプ（ISO 8601 UTC）
WHERE: 実行環境（local-dev / GitHub Actions / Vercel）
RESULT: 成功 / 失敗 / ブロック
THREAT: 対応する THREAT-ID（該当する場合）
```

### 4.3 AI エージェント操作の追加記録要件

Claude Code が実行した操作は、通常のコミット履歴に加えて以下を記録する。

- PR の説明欄に「AI-generated: claude-sonnet-4-6」と明記する
- セキュリティ関連コード変更の場合、対応する THREAT-ID と REQ-SEC ID を PR 説明に列挙する
- Gate-02〜04 を通過した操作には承認者のコメントを PR に残す

---

## 5. 操作制限

### 5.1 禁止操作リスト

AI エージェントが**いかなる理由があっても実行してはならない**操作。

| 禁止操作 | 理由 | 代替 |
|---------|------|------|
| 本番デプロイコマンドの直接実行 | Gate-01 の承認なしデプロイ禁止 | Gate-01 承認後にのみ実行 |
| `package.json` のセキュリティパッチ適用（自動） | Gate-03 の承認なし変更禁止 | PR を作成して承認を得る |
| `vite.config.ts` の `sourcemap: true`（本番） | T-09: ソースコード露出 | 開発環境のみ `inline` 許可 |
| `eval()` / `new Function()` を含むコードの生成 | 任意コード実行リスク | 静的実装に変更 |
| `innerHTML` へのユーザー入力直接代入 | XSS リスク | `textContent` / DOM API |
| localStorage への生データ直接書き込み | T-02, T-03: 検証バイパス | `StorageAdapter` 経由のみ |
| Tiled JSON の未検証フィールドを直接使用 | T-05, T-14, T-15: 不正値注入 | Zod スキーマ検証を経由 |
| GitHub Secrets / 環境変数のハードコード | 認証情報露出 | `.env` / GitHub Secrets を使用 |
| `node_modules` 内ファイルの直接変更 | パッケージ整合性の破壊 | パッチには `patch-package` を使用 |
| Phase 3: WebSocket への未認証メッセージ送信ロジック | T-P3-01, T-P3-03: 認証バイパス | JWT 検証後のみ送信 |

### 5.2 レート制限

| 操作 | 制限 | 超過時の挙動 |
|------|------|------------|
| レベルエディタ（開発時）の Tiled JSON 保存 | 60 秒に 1 回 | 保存を拒否し、警告メッセージを表示 |
| `StorageAdapter.save()` の呼び出し | ゲーム内 1 分に 1 回（セーブポイント到達時のみ） | 重複保存をスキップ |
| Phase 3: WebSocket メッセージ送信 | 60 メッセージ / 秒（60fps 相当） | 超過クライアントを一時切断（T-P3-04） |
| Phase 3: Colyseus Room 参加リクエスト | 10 回 / 分 / IP | 一時 IP ブロック（Anti-DoS） |
| CI/CD パイプライン実行 | GitHub Actions の標準制限に従う | キューイング |

### 5.3 入力サイズ制限

| 入力種別 | 最大サイズ | 違反時の挙動 | 対応 THREAT-ID |
|---------|-----------|------------|--------------|
| Tiled JSON マップファイル（1 ステージ） | 500 KB | ロードを拒否、エラーシーンへ遷移 | T-05, T-13 |
| localStorage 書き込みデータ（1 件） | 500 KB | 書き込みを拒否、`QuotaExceededError` を捕捉 | T-13 |
| localStorage 総使用量 | 4 MB（5MB 上限の 80%） | 警告ログ出力、古いデータを削除候補とする | T-13 |
| レベルエディタ入力（`targetStageId` 文字列） | 10 文字 | バリデーションエラー、デフォルト値にフォールバック | T-15 |
| レベルエディタ入力（`itemType` 文字列） | 20 文字 | allowlist 検証で拒否 | T-14 |
| Phase 3: WebSocket メッセージ（1 件） | 1 KB | メッセージを破棄、クライアントに警告送信 | T-P3-02, T-P3-04 |
| Phase 3: プレイヤー座標移動量（1 フレーム） | 水平 200px/s, 垂直 600px/s | サーバーで棄却、正当な座標を送信（Anti-Cheat） | T-P3-03 |

---

## 6. threat-model.md 緩和策との対応マトリクス

| THREAT-ID | リスクスコア | ガードレール条項 | 対応 REQ-SEC | 実装フェーズ |
|-----------|------------|----------------|------------|------------|
| T-01 | 6 (Medium) | §1.3 Admin（ホスティング単一ドメイン固定） | REQ-SEC-001 | Phase 1 |
| T-02 | 8 (Medium) | §3.1 警告パターン（localStorage 直接呼び出し禁止）、§5.1 禁止操作 | REQ-SEC-002 | Phase 1 |
| T-03 | 10 (High) | §3.3 セキュリティレビュー必須（HMAC 変更時）、§1.3 Admin（HMAC シークレット変更） | REQ-SEC-003 | Phase 1 |
| T-04 | 8 (Medium) | §3.1 警告パターン（`window[]` グローバル公開禁止）、§3.3 セキュリティレビュー | REQ-SEC-004 | Phase 1 |
| T-05 | 6 (Medium) | §2 Gate-02（レベルデータ審査）、§5.3 入力サイズ制限、§3.3 セキュリティレビュー | REQ-SEC-005 | Phase 1 |
| T-06 | 4 (Low) | §2 Gate-01（デプロイ前承認）、§1.3 Admin（CSP / SRI 変更）、§2 Gate-04 | REQ-SEC-006, 007 | Phase 1-2 |
| T-07 | 4 (Low) | §2 Gate-03（npm 更新承認）、§1.3 Admin（メジャー更新） | REQ-SEC-008 | Phase 1-2 |
| T-08 | 3 (Low) | 許容リスク（Phase 1-2 はローカルスコアのみ） | REQ-SEC-009 | Phase 3 |
| T-09 | 8 (Medium) | §2 Gate-01（sourcemap: false 確認）、§1.3 Admin（sourcemap 設定）、§5.1 禁止操作 | REQ-SEC-010 | Phase 1 |
| T-10 | 6 (Medium) | §2 Gate-01（console drop 確認）、§3.1 警告パターン（console.log）、§1.3 Admin | REQ-SEC-011 | Phase 1 |
| T-11 | 6 (Medium) | §3.3 セキュリティレビュー（fps 設定変更時）、§3.1 禁止パターン（eval / setTimeout 文字列） | REQ-SEC-012 | Phase 1-2 |
| T-12 | 9 (Medium) | §3.1 警告パターン（エンティティ上限なしスポーン）、§3.3 セキュリティレビュー（MAX定数変更） | REQ-SEC-013 | Phase 1 |
| T-13 | 4 (Low) | §5.3 入力サイズ制限（localStorage 500KB 上限）、§5.2 レート制限 | REQ-SEC-014 | Phase 2 |
| T-14 | 6 (Medium) | §2 Gate-02（itemType enum 検証）、§3.3 セキュリティレビュー（allowlist 変更） | REQ-SEC-005, 015 | Phase 1 |
| T-15 | 6 (Medium) | §2 Gate-02（targetStageId allowlist 検証）、§5.3 入力サイズ制限、§3.3 セキュリティレビュー | REQ-SEC-005, 016 | Phase 1-2 |
| T-P3-01 | 12 (High) | §1.3 Admin（JWT 設定変更）、§3.3 セキュリティレビュー（JWT 検証変更）、§5.1 禁止操作 | REQ-SEC-P3-03 | Phase 3 |
| T-P3-02 | 12 (High) | §1.3 Admin（WebSocket サーバー設定）、§5.3 入力サイズ制限（メッセージ 1KB） | REQ-SEC-P3-02 | Phase 3 |
| T-P3-03 | 16 (High) | §3.3 セキュリティレビュー（Anti-Cheat 速度制限変更）、§5.3 入力サイズ制限（座標移動量） | REQ-SEC-P3-01, P3-05 | Phase 3 |
| T-P3-04 | 12 (High) | §5.2 レート制限（WebSocket 60msg/s）、§3.3 セキュリティレビュー（レート制限変更） | REQ-SEC-P3-04 | Phase 3 |
| T-P3-05 | 10 (High) | §1.3 Admin（Colyseus Room API 設定）、§5.1 禁止操作（未認証メッセージ） | REQ-SEC-P3-03 | Phase 3 |

---

## 7. ガードレール違反時の対応手順

### Severity: CRITICAL（即時停止）

**発動条件**: §3.1 絶対禁止パターン（eval, innerHTML, ハードコード秘密鍵等）の生成検出

1. AI エージェントは即時生成を停止する
2. 違反内容と対応する THREAT-ID を報告する
3. 安全な代替実装を提案する
4. Security Architect のレビューを要求する
5. 違反を `.claude/hooks/mistakes.md` に記録する

### Severity: HIGH（ゲートで停止）

**発動条件**: Gate-01〜04 のトリガー、§3.3 セキュリティレビュー必須トリガー

1. AI エージェントは処理を停止し、承認が必要な旨を明示する
2. 必要な確認項目をチェックリスト形式で提示する
3. 承認者名とタイムスタンプを記録するよう促す
4. 承認後に処理を再開する

### Severity: MEDIUM（警告して続行）

**発動条件**: §3.1 警告必須パターン（console.log 等）

1. 警告内容と理由を説明する
2. ユーザーに続行の確認を求める
3. 承認された場合は処理を続行する
4. PR 説明に警告内容を明記するよう促す

---

## 8. 品質メトリクス（ガードレール観点）

| 指標 | 目標 | 計測方法 | 対応 THREAT-ID |
|------|------|---------|--------------|
| ガードレール違反件数（CRITICAL） | 0 件 / リリース | `.claude/hooks/mistakes.md` | 全脅威 |
| Gate-01 通過率 | 100%（全本番デプロイで実施） | GitHub Actions ログ | T-06, T-07, T-09, T-10 |
| Gate-02 通過率 | 100%（全 Tiled JSON 変更で実施） | GitHub PR レビューログ | T-05, T-14, T-15 |
| テスト必須ゲート遵守率 | 100%（全セキュリティコード変更で実施） | PR チェックリスト | T-02, T-03, T-12, T-13 |
| セキュリティ関連テストカバレッジ | 80% 以上（REQ-SEC-002, 003, 014） | Vitest coverage | T-02, T-03, T-13 |
| 禁止パターン検出（SAST） | High 以上 0 件 | ESLint Security Plugin | T-09, T-10, T-11 |
| Critical CVE（SCA） | 0 件 | npm audit / Snyk | T-07 |

---

## 9. 実装委任

| 担当 | ガードレール実装タスク |
|------|---------------------|
| **backend-developer** | §5.2 レート制限（StorageAdapter.save()）、§5.3 入力サイズ制限（localStorage / Tiled JSON）、§3.1 禁止パターン検出（TypeScript ESLint ルール設定） |
| **devops-engineer** | Gate-01 の CI/CD パイプライン自動チェック（SAST, SCA, sourcemap 確認）、§4 監査証跡の GitHub Actions 設定、SRI ハッシュ自動生成設定 |
| **security-scanner** | §3.1 禁止パターンの ESLint Security Plugin ルール設定、デプロイ前 SAST/DAST スキャン実施、CSP 評価（securityheaders.com） |
