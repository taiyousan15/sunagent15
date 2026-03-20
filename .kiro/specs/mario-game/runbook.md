# Runbook: mario-game

> Phaser 3 + TypeScript 製ブラウザ 2D プラットフォーマーゲーム（GitHub Pages / Vercel 静的ホスティング）向け運用手順書。
> SLO定義（slo.md）および設計文書（design.md）を前提とする。

---

## 目次

1. [Severity 定義](#1-severity-定義)
2. [インシデントシナリオ](#2-インシデントシナリオ)
   - [INC-001: フレームレート低下（SLO-001 違反）](#inc-001-フレームレート低下fps--30)
   - [INC-002: アセットロード失敗（404 / CDN 障害）](#inc-002-アセットロード失敗404--cdn-障害)
   - [INC-003: セーブデータ破損（localStorage corruption）](#inc-003-セーブデータ破損localstorage-corruption)
   - [INC-004: メモリリーク（長時間プレイ時）](#inc-004-メモリリーク長時間プレイ時)
   - [INC-005: ビルド / デプロイ失敗（GitHub Actions / Vercel）](#inc-005-ビルド--デプロイ失敗github-actions--vercel)
   - [INC-006: XSS / セキュリティインシデント（レベルエディタ経由）](#inc-006-xss--セキュリティインシデントレベルエディタ経由)
3. [ロールバック手順](#3-ロールバック手順)
4. [ポストモーテムテンプレート](#4-ポストモーテムテンプレート)
5. [参考: SLO 閾値クイックリファレンス](#5-参考-slo-閾値クイックリファレンス)

---

## 1. Severity 定義

| Severity | 概要 | 初動目標 | 解決目標 | エスカレーション先 |
|----------|------|---------|---------|------------------|
| **SEV1** | ゲーム完全不可（ブランク画面・クラッシュループ・全プレイヤー影響） | 15 分以内に担当者着手 | 2 時間以内に修正デプロイ | 開発リード + セミナー主催者へ即時連絡 |
| **SEV2** | コア機能障害（セーブ不能・特定ステージ再現クラッシュ・SLO-001 違反（60fps維持率 < 95%が5分以上継続）） | 30 分以内に担当者着手 | 8 時間以内に修正デプロイ | 開発チームへ Slack 通知 |
| **SEV3** | 部分的劣化（特定ブラウザのみ遅延・音声不具合・UI 崩れ） | 2 時間以内にトリアージ | 48 時間以内に修正デプロイ | GitHub Issue に記録・次スプリントで対応 |
| **SEV4** | 軽微（誤字・コスメティックバグ・警告ログ） | 翌営業日までにトリアージ | 次回リリースで対応 | GitHub Issue に記録 |

### Severity 判定フロー

```
[アラート / 報告]
    │
    ├─ ゲームが完全に起動しない / 全セッションでクラッシュ
    │    → SEV1
    │
    ├─ プレイは可能だが SLO-001 違反（60fps維持率 < 95%）が5分以上継続 / セーブが常に失敗
    │    → SEV2
    │
    ├─ 一部ブラウザ or 一部ステージのみで問題が再現する
    │    → SEV3
    │
    └─ 上記に該当しない
         → SEV4
```

---

## 2. インシデントシナリオ

---

### INC-001: フレームレート低下（SLO-001 違反: 60fps 維持率 < 95%）

**Severity**: SEV2（30秒ウィンドウで 60fps 維持率 < 95% が 5分以上継続） / SEV3（断続的）
**SLO 関連**: SLO-001（フレームレート安定性 >= 95%）

#### 症状

- FpsMonitor が SLO-001 違反（60fps維持率 < 95%、30秒ウィンドウ）を報告
- ゲームの動きがカクつき、プレイヤー操作が遅延する
- `[SLO-001 WARN] FPS rate X% below 95%` がコンソールに出力される
- GA4 `slo_violation` イベントで `metric: fps_rate` が多数記録される

#### 原因（頻度順）

| # | 原因 | 判別方法 |
|---|------|---------|
| 1 | レンダリングコストの過大（タイル・スプライト描画過多） | Chrome DevTools > Rendering > FPS Meter |
| 2 | 衝突判定の O(n²) 化（EntityManager 過負荷） | Performance Profile > `CollisionSystem.update` |
| 3 | オブジェクトプール未使用による GC 頻発 | Memory タブで頻繁なヒープ増減 |
| 4 | Howler.js 音声デコードのメインスレッド占有 | Performance > Audio セクション |
| 5 | setInterval / setTimeout の誤用（フレーム外処理） | Sources タブで非 rAF タイマー確認 |

#### 診断手順

```
Step 1: Chrome DevTools を開く（F12）
  → Performance タブ → Record（5 秒）→ 停止 → FPS チャート確認

Step 2: FPS 低下が描画起因か確認
  → Rendering > FPS Meter を有効化
  → GPU: Raster / Paint の時間が長ければ描画コスト過多

Step 3: JavaScript 処理時間を特定
  → Performance flame chart で長い関数ブロックを特定
  → 主犯関数のソースファイルと行番号を記録

Step 4: メモリプレッシャー確認
  → Memory タブ > Take Heap Snapshot（1 分間隔で 2 回）
  → Retained Size が増加し続けていれば GC 過多の可能性

Step 5: 再現条件を絞る
  → 特定のステージ（敵数・コイン数）で発生するか確認
  → 長時間プレイ後にのみ発生する場合は INC-004（メモリリーク）を疑う
```

#### 復旧手順

```
# パターン A: 描画コスト過多
1. GameScene の update() 内で不要な setAlpha / setScale 呼び出しを削除
2. 画面外オブジェクトを setActive(false) / setVisible(false) でスキップ
3. TilemapLoader で decoration レイヤーのカリングを有効化
4. npm run build && vercel --prod (または git push)

# パターン B: 衝突判定過負荷
1. CollisionSystem のグループ数を削減
2. 必要でない敵グループを physicsGroup から除外
3. EntityManager でカメラ外エンティティを物理演算から除外

# パターン C: GC 過多
1. ObjectPool を導入（Goomba / KoopaTroopa / Coin で共用）
2. new オブジェクト生成を update() ループ外に移動
3. 既存 Pool があれば pool.get() が正しく呼ばれているか確認
```

#### 予防策

- `src/metrics/FpsMonitor.ts` を常時稼働させ、30s ウィンドウで 95% 未満をアラート
- CI で Lighthouse Performance スコア >= 85 をチェック（SLO-005 / REQ-902 準拠）
- オブジェクトプール上限を 50 件以上確保（REQ-912）
- `GameScene.update()` に cyclomatic complexity チェック（ESLint max-complexity: 10）

---

### INC-002: アセットロード失敗（404 / CDN 障害）

**Severity**: SEV1（全アセット失敗・ゲーム起動不可） / SEV2（特定アセットのみ）
**SLO 関連**: SLO-002（初期ロード P95 <= 3,000ms）、SLA Availability >= 99.5%

#### 症状

- LoadingScene のプログレスバーが 100% に到達しない
- `Failed to load resource: the server responded with a status of 404` がコンソールに出力
- TitleScene に遷移しない（ゲームが起動しない）
- 特定ステージで音声 / スプライトが表示されない

#### 原因

| # | 原因 | 判別方法 |
|---|------|---------|
| 1 | デプロイ時のアセットパス誤り | Network タブで 404 URL を確認 |
| 2 | GitHub Pages のベースパス設定ミス（`/mario-game/` vs `/`） | vite.config.ts の `base` 設定を確認 |
| 3 | CDN キャッシュの古いバージョンが残存 | Hard Reload（Ctrl+Shift+R）で再現しないか確認 |
| 4 | アセットファイル名の大文字/小文字不一致（macOS vs Linux） | `ls public/assets/` で実際のファイル名を確認 |
| 5 | Vercel / GitHub Pages の一時障害 | https://www.githubstatus.com / https://www.vercel-status.com を確認 |

#### 診断手順

```
Step 1: ブラウザ Network タブを開き、ページをリロード
  → 404 / 5xx のレスポンスを赤色でフィルタ
  → 問題のある URL を記録

Step 2: アセットパスの確認
  $ ls public/assets/sprites/
  $ ls public/assets/audio/
  $ ls public/assets/maps/
  → ファイル名が src/scenes/BootScene.ts の load.image() / load.audio() と一致するか確認

Step 3: vite.config.ts の base 設定を確認
  $ grep -n "base" vite.config.ts
  → GitHub Pages の場合: base: '/mario-game/' (リポジトリ名)
  → Vercel の場合: base: '/'

Step 4: デプロイ済みファイル一覧を確認
  # GitHub Pages の場合
  $ gh api repos/{owner}/{repo}/contents/dist --jq '.[].name'

  # Vercel の場合
  $ vercel ls --prod
```

#### 復旧手順

```
# ケース A: アセットファイルの欠損
1. public/assets/ に不足ファイルを追加
2. git add public/assets/<missing-file>
3. git commit -m "fix: add missing asset <filename>"
4. git push origin main
   → GitHub Actions が自動デプロイ（5 分以内に反映）

# ケース B: パス設定ミス
1. vite.config.ts の base を修正
2. npm run build でローカル確認
   $ npx serve dist  # localhost:3000 で動作確認
3. git commit -m "fix: correct vite base path for GitHub Pages"
4. git push origin main

# ケース C: Vercel / GitHub Pages 障害
1. status ページで障害を確認
2. 障害が長期化する場合は代替ホスティングを検討
   # Netlify への一時切替
   $ npm run build
   $ npx netlify deploy --dir=dist --prod
3. 復旧後、元の URL への DNS / リダイレクト設定を戻す
```

#### 予防策

- CI に `assets-check` ステップを追加し、`src/` で参照されるアセットキーが `public/assets/` に存在することを検証
- BootScene でアセット一覧を定数化し、存在しないキーをビルド時に検出する
- UptimeRobot（無料）で本番 URL を 5 分間隔で監視

---

### INC-003: セーブデータ破損（localStorage corruption）

**Severity**: SEV2
**SLO 関連**: SLO-005（セーブ/ロード成功率 >= 99.9%）

#### 症状

- ゲーム起動時に `[SLO-005 ERROR] Save operation failed` がコンソールに出力
- ハイスコアが 0 にリセットされる / ステージ進行が失われる
- `JSON.parse()` でエラーが発生し、GameOverScene でスコアが保存されない
- localStorage の `mario-game-save` エントリが `undefined` または不正な JSON

#### 原因

| # | 原因 | 判別方法 |
|---|------|---------|
| 1 | localStorage の容量上限（5MB）超過 | `navigator.storage.estimate()` で使用量確認 |
| 2 | セーブデータスキーマのバージョン不一致（`SaveData.version` 変更後） | localStorage の値と SaveData interface を比較 |
| 3 | ブラウザのプライベートモード / ストレージ制限設定 | 通常モードで再現するか確認 |
| 4 | 書き込み中のタブクローズによる不完全な JSON | localStorage の値を手動で確認 |
| 5 | 複数タブ同時書き込みによるレースコンディション | 2 タブ同時プレイで再現するか確認 |

#### 診断手順

```
Step 1: localStorage の内容を確認
  ブラウザコンソール:
  > JSON.parse(localStorage.getItem('mario-game-save'))
  → SyntaxError が出れば破損確定

Step 2: ストレージ使用量を確認
  > navigator.storage.estimate().then(e => console.log(e))
  → usage が quota の 90% 超なら容量問題

Step 3: セーブデータのバージョンを確認
  > JSON.parse(localStorage.getItem('mario-game-save')).version
  → 現在の SaveData.version（src/models/save.ts）と比較

Step 4: 書き込み失敗のログを確認
  > MetricsCollector.buffer.filter(e => e.name === 'save_failure')
```

#### 復旧手順

```
# ケース A: JSON 破損 → セーブデータリセット（ユーザー向け手順）
  ブラウザコンソール:
  > localStorage.removeItem('mario-game-save')
  > location.reload()
  ※ ハイスコア・進行は失われる。ユーザーへ謝罪と説明を行う

# ケース B: バージョン不一致 → マイグレーション処理を実装
  src/managers/SaveManager.ts に migrate() を追加:

  function migrate(raw: unknown): SaveData {
    const data = raw as Record<string, unknown>
    if (data.version === 1) {
      // v1 → v2 マイグレーション例
      return {
        ...DEFAULT_SAVE_DATA,
        highScore: (data.highScore as number) ?? 0,
        version: 2,
        savedAt: Date.now(),
      }
    }
    return DEFAULT_SAVE_DATA
  }

  git commit -m "fix: add SaveData migration for version mismatch"
  git push origin main

# ケース C: 容量超過 → 古いデータを削除
  SaveManager に cleanup() を実装:
  → stageProgress から cleared: false のエントリを削除
  → 余裕がなければ highScore のみ残して他をリセット
```

#### 予防策

- `SaveManager.save()` を try-catch で囲み、失敗時は `MetricsCollector.increment('save_failure')` を必ず呼ぶ（SLI-005 実装必須）
- セーブ前に `JSON.stringify(data).length` をチェックし、4.5MB 超で警告
- `SaveData.version` を変更する際は PR に migration コードを必ず含める
- 書き込みは必ずシリアル化（同時書き込み防止フラグ `isSaving: boolean` を SaveManager に持つ）

---

### INC-004: メモリリーク（長時間プレイ時）

**Severity**: SEV2（ブラウザタブがクラッシュ） / SEV3（動作低下のみ）
**SLO 関連**: SLO-001（FPS >= 95%）、SLO-006（クラッシュ率 <= 0.1%）

#### 症状

- 15 分以上プレイ後に FPS が徐々に低下する
- Chrome タスクマネージャーでタブのメモリ使用量が増加し続ける（> 512MB）
- ステージ遷移のたびにメモリが増加し、ベースラインに戻らない
- 最終的にブラウザが「ページが応答していません」を表示

#### 原因

| # | 原因 | 判別方法 |
|---|------|---------|
| 1 | Phaser シーン破棄時に EventEmitter リスナーが残存 | Heap Snapshot の Detached EventTarget を確認 |
| 2 | Howler.js サウンドオブジェクトが unload() されない | `Howler._howls.length` をコンソールで確認 |
| 3 | setInterval / setTimeout がシーン終了後も残存 | Performance タブで継続するタイマーを確認 |
| 4 | ObjectPool の解放漏れ（Enemy / Coin が destroy されない） | EntityManager の activeEnemies.length を監視 |
| 5 | requestAnimationFrame ループが複数起動している | `FpsMonitor` の animationFrameId が複数存在 |

#### 診断手順

```
Step 1: Heap 増加の確認
  Chrome DevTools > Memory > Take Heap Snapshot
  → 10 分プレイ後に再度スナップショット
  → Summary ビューで増加した Constructor を特定

Step 2: Detached DOM / EventTarget の確認
  Heap Snapshot の Containment ビューでフィルタ:
  → "Detached" でフィルタ
  → 残存している Phaser.Scene / Phaser.GameObjects を確認

Step 3: Howler.js の状態確認
  ブラウザコンソール:
  > Howler._howls.length  // 増加し続けていればリーク
  > Howler._howls.map(h => h._src)  // どのサウンドが残存しているか

Step 4: タイマーの確認
  Performance > Event Log で timerFire を検索
  → 期待より多い場合は clearInterval / clearTimeout の漏れ

Step 5: 再現ステップを最小化
  → ステージ遷移を 10 回繰り返す（GameScene → StageClearScene → GameScene）
  → 各遷移後の Heap サイズを記録
```

#### 復旧手順

```
# 即時対応: ゲームのリロード案内（ユーザー向け）
  → ゲーム内に「長時間プレイ後は F5 でリロードを推奨」の旨を表示

# 根本対応 A: シーン shutdown() でリスナー削除
  GameScene.ts に shutdown() を追加:
  shutdown(): void {
    this.events.off(Phaser.Scenes.Events.SHUTDOWN)
    this.inputManager.destroy()
    this.entityManager.destroyAll()
    this.audioController.stopAll()
  }

# 根本対応 B: Howler.js サウンドの明示的 unload
  AudioController.ts:
  stopAll(): void {
    this.bgm?.unload()
    this.sePool.forEach(s => s.unload())
    this.bgm = null
  }

# 根本対応 C: FpsMonitor の二重起動防止
  FpsMonitor.ts:
  start(): void {
    if (this.animationFrameId !== 0) return  // 二重起動ガード
    this.animationFrameId = requestAnimationFrame(this.tick.bind(this))
  }

  git commit -m "fix: resolve memory leak in scene shutdown and Howler cleanup"
  git push origin main
```

#### 予防策

- 全シーンに `shutdown()` メソッドを実装し、EventEmitter / タイマー / オブジェクトを解放する
- Vitest で「シーン遷移 10 回後の heapUsed 増分 < 50MB」の統合テストを追加
- CI で `--expose-gc` フラグを使ったメモリ回帰テストを週次実行

---

### INC-005: ビルド / デプロイ失敗（GitHub Actions / Vercel）

**Severity**: SEV2（ホットフィックスがデプロイできない） / SEV3（通常の機能追加 PR）
**SLO 関連**: SLA（main push から 5 分以内にデプロイ完了）

#### 症状

- GitHub Actions の `ci.yml` ワークフローが `failure` ステータスになる
- Vercel のデプロイが `Error` 状態で止まる
- 本番 URL が古いバージョンのまま更新されない
- PR に「Required checks have not passed」と表示される

#### 原因

| # | 原因 | 判別方法 |
|---|------|---------|
| 1 | TypeScript コンパイルエラー（SLO-009 違反） | Actions ログ: `npx tsc --noEmit` のエラー出力 |
| 2 | ESLint エラー（SLO-010 違反） | Actions ログ: `npx eslint src/` のエラー出力 |
| 3 | テストカバレッジ 80% 未満（SLO-008 違反） | Actions ログ: `vitest run --coverage` の coverage report |
| 4 | バンドルサイズ > 10MB（SLO-007 違反） | Actions ログ: bundle size check ステップ |
| 5 | npm install 失敗（package-lock.json の不整合） | Actions ログ: `npm ci` の exit code |
| 6 | Node.js バージョン不一致 | Actions ログ: `node --version` と .nvmrc を比較 |

#### 診断手順

```
Step 1: GitHub Actions のログを確認
  $ gh run list --limit 5
  $ gh run view <run-id> --log-failed

Step 2: 失敗ステップを特定
  ログの "Error" / "FAIL" / "error TS" を検索
  → TypeScript エラー: "error TS" で始まる行
  → ESLint エラー: "X problems (Y errors, Z warnings)"
  → カバレッジ: "Coverage threshold not met"
  → バンドルサイズ: "Bundle size XMB exceeds 10MB SLO"

Step 3: ローカルで再現確認
  $ npm ci
  $ npx tsc --noEmit
  $ npx eslint src/
  $ npx vitest run --coverage
  $ npm run build && du -sm dist/
```

#### 復旧手順

```
# ケース A: TypeScript エラー
  $ npx tsc --noEmit 2>&1 | head -50
  → エラーファイルと行番号を特定して修正
  $ git commit -m "fix: resolve TypeScript compile errors"

# ケース B: ESLint エラー
  $ npx eslint src/ --fix  # 自動修正可能なものを修正
  → 残ったエラーを手動修正
  $ git commit -m "fix: resolve ESLint errors"

# ケース C: カバレッジ不足
  $ npx vitest run --coverage 2>&1 | grep "Uncovered"
  → カバレッジが低いファイルにテストを追加
  $ git commit -m "test: add unit tests to meet 80% coverage threshold"

# ケース D: バンドルサイズ超過
  $ npm run build -- --analyze  # vite-bundle-visualizer で確認
  → 不要なライブラリを削除、またはコード分割を追加
  → アセット（PNG）を WebP に変換: npx sharp-cli input.png -o output.webp
  $ git commit -m "perf: reduce bundle size below 10MB SLO"

# ケース E: Vercel デプロイ失敗（ローカルビルドは成功）
  $ vercel --debug  # 詳細ログで原因を確認
  → 環境変数が設定されているか確認: vercel env ls
  → build コマンドの確認: vercel.json の "buildCommand" フィールド
```

#### 予防策

- ローカルで `npm run pre-push`（tsc + eslint + vitest の統合スクリプト）を実行してから push する
- Git pre-push hook として登録:
  ```bash
  # .git/hooks/pre-push
  npm run typecheck && npm run lint && npx vitest run
  ```
- Actions の `workflow_dispatch` を有効化し、手動デプロイを可能にする
- Vercel の Preview Deployment を活用し、main への merge 前に確認する

---

### INC-006: XSS / セキュリティインシデント（レベルエディタ経由）

**Severity**: SEV1（XSS が確認された場合）
**SLO 関連**: SLA（クラッシュ報告から 24 時間以内に修正 PR）

#### 症状

- レベルエディタ（Phase 3 実装予定）でカスタム JSON を読み込んだ際に任意スクリプトが実行される
- `window.onerror` で想定外のスクリプトエラーが記録される
- ブラウザコンソールに外部ドメインへのリクエストが発生する
- プレイヤーの localStorage データが外部に送信される（cookie / セーブデータ漏洩）

> **注意**: Phase 3 で Colyseus マルチプレイを追加する際、サーバーサイドの検証も必須。

#### 原因

| # | 原因 | 判別方法 |
|---|------|---------|
| 1 | `eval()` または `new Function()` でマップ JSON を評価 | BootScene / TilemapLoader のコードを grep |
| 2 | Tiled JSON の `properties` フィールドを `innerHTML` に直接代入 | UIScene / HUD コードを grep |
| 3 | ユーザー入力（ステージ名等）のサニタイズ漏れ | エスケープ処理の有無を確認 |
| 4 | Colyseus メッセージに含まれるペイロードの未検証（Phase 3） | WebSocket メッセージハンドラを確認 |

#### 診断手順

```
Step 1: XSS の確認
  ブラウザコンソール:
  > window._xss_test = true
  → 悪意ある JSON を読み込んだ後に _xss_test が undefined なら XSS なし

Step 2: innerHTML / eval の使用箇所を検索
  $ grep -rn "innerHTML\|eval\|new Function\|document.write" src/
  → 存在する場合は全て精査

Step 3: Tiled JSON のプロパティ展開箇所を確認
  $ grep -n "properties" src/systems/TilemapLoader.ts
  → properties の値が DOM に挿入されていないか確認

Step 4: Network タブで外部リクエストの確認
  → 不審な外部ドメインへの POST / XHR / fetch を確認

Step 5: localStorage の内容を確認
  > Object.keys(localStorage)
  → 想定外のキーが追加されていないか確認
```

#### 復旧手順

```
# 即時対応（SEV1）
1. GitHub Pages / Vercel で対象の URL を一時的に無効化
   # GitHub Pages: リポジトリ Settings > Pages > Source を None に変更
   # Vercel: vercel alias rm <deployment-url>

2. 影響範囲を特定
   → GA4 で当該セッションの session_id を収集
   → 影響を受けたユーザーに通知（セミナー参加者へのメール等）

# 根本対応 A: innerHTML の除去
  UIScene.ts / その他の DOM 操作を textContent / Phaser Text に置換:
  // WRONG:
  element.innerHTML = stageData.properties.name
  // CORRECT:
  this.add.text(x, y, stageData.properties.name)  // Phaser テキストオブジェクト

# 根本対応 B: JSON 入力のスキーマ検証
  TilemapLoader.ts に zod バリデーションを追加:
  import { z } from 'zod'

  const MapObjectSchema = z.object({
    id: z.number(),
    type: z.enum(['goal_flag', 'pipe_entrance', 'enemy_spawn', 'item_block']),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    properties: z.record(z.union([z.string(), z.number(), z.boolean()])),
  })

# 根本対応 C: CSP ヘッダーの設定（vercel.json）
  {
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://www.google-analytics.com"
          }
        ]
      }
    ]
  }

  git commit -m "security: add CSP headers and input validation for level data"
  git push origin main

# Phase 3 追加対応（Colyseus）
  → サーバーサイドで Colyseus Room の onMessage() に zod バリデーションを実装
  → クライアントから受け取ったマップデータは絶対に eval しない
```

#### 予防策

- `innerHTML` / `eval` / `document.write` を ESLint ルールで禁止（`no-eval`, `no-implied-eval`）
- Tiled JSON の読み込み前に zod スキーマで型検証を必須化
- CSP ヘッダーを vercel.json に設定（`script-src 'self'` でインラインスクリプトをブロック）
- Phase 3 Colyseus 実装前にセキュリティレビューを実施

---

## 3. ロールバック手順

### 3.1 前提

- GitHub リポジトリに全ての変更が push されている
- main ブランチが自動デプロイに設定されている（GitHub Actions / Vercel）
- `git log --oneline` で過去のコミットハッシュが確認可能

### 3.2 手順

#### Step 1: 問題のあるコミットを特定

```bash
# 直近 10 件のコミット履歴を確認
git log --oneline -10

# 例:
# abc1234 feat: add level editor (問題のあるコミット)
# def5678 fix: fix input latency      ← ロールバック先
# ghi9012 feat: add stage 1-3
```

#### Step 2: revert コミットを作成

```bash
# 特定のコミットを revert（新しい revert コミットを作成）
git revert abc1234 --no-edit

# 複数コミットを revert する場合（新しい順に指定）
git revert abc1234 bcd2345 --no-edit
```

> `git reset --hard` は使用しない。push 済みのコミットをリセットすると他の開発者の作業が破壊される。

#### Step 3: 再デプロイ

```bash
# main ブランチに push（自動デプロイが起動）
git push origin main

# GitHub Actions のデプロイ状況を確認
gh run list --limit 3
gh run watch  # デプロイ完了まで待機（通常 2〜5 分）
```

#### Step 4: デプロイ確認

```bash
# 本番 URL が正しいバージョンになっているか確認
curl -I https://<your-domain>/

# Vercel の場合: デプロイ一覧を確認
vercel ls --prod
```

#### Step 5: ユーザーへの通知（SEV1 / SEV2 の場合）

```
【通知テンプレート】
件名: mario-game 一時的な問題と復旧のお知らせ

発生日時: YYYY-MM-DD HH:MM（JST）
復旧日時: YYYY-MM-DD HH:MM（JST）
影響範囲: [影響を受けたユーザー / 機能]
原因: [簡潔な説明]
対応: [ロールバックによる旧バージョンへの切り戻し]
今後: [根本対応の予定]
```

### 3.3 Vercel の場合: デプロイ履歴からのロールバック

```bash
# デプロイ一覧を確認
vercel ls

# 特定のデプロイを本番に昇格
vercel alias set <previous-deployment-url> <production-domain>
```

---

## 4. ポストモーテムテンプレート

> インシデント解決後 48 時間以内に作成し、GitHub Issues（またはチーム Wiki）に投稿する。
> Blameless（責任追及なし）を原則とし、システムと手順の改善にフォーカスする。

---

### ポストモーテム: [インシデント概要タイトル]

**インシデント ID**: INC-YYYYMMDD-XXX
**Severity**: [SEV1 / SEV2 / SEV3]
**発生日時**: YYYY-MM-DD HH:MM（JST）
**復旧日時**: YYYY-MM-DD HH:MM（JST）
**ダウンタイム / 影響時間**: X 時間 Y 分
**影響ユーザー数**: 推定 X 名（セミナー参加者）
**作成者**: [担当者名]
**レビュー者**: [レビュー者名]

---

#### 1. インシデント概要

[何が起きたか、何が影響を受けたか、どのように検知されたかを 2〜3 文で要約する]

---

#### 2. タイムライン

| 時刻（JST） | イベント | 対応者 |
|------------|---------|-------|
| HH:MM | [現象が最初に確認された / アラートが発生した] | - |
| HH:MM | [担当者がインシデントを認識した] | [氏名] |
| HH:MM | [原因の仮説 A を調査開始] | [氏名] |
| HH:MM | [原因の仮説 A を棄却] | [氏名] |
| HH:MM | [根本原因を特定した] | [氏名] |
| HH:MM | [修正を実装・レビュー完了] | [氏名] |
| HH:MM | [修正をデプロイ（git push / vercel）] | [氏名] |
| HH:MM | [復旧を確認] | [氏名] |

---

#### 3. 根本原因分析（5-Whys）

**問題**: [発生した現象を一文で記述]

| Why | 問い | 答え |
|-----|------|------|
| Why 1 | なぜ [問題] が起きたのか？ | [回答 1] |
| Why 2 | なぜ [回答 1] になったのか？ | [回答 2] |
| Why 3 | なぜ [回答 2] になったのか？ | [回答 3] |
| Why 4 | なぜ [回答 3] になったのか？ | [回答 4] |
| Why 5 | なぜ [回答 4] になったのか？ | [根本原因] |

**根本原因**: [5-Whys の最終回答を 1〜2 文で記述]

---

#### 4. 影響分析

| 観点 | 詳細 |
|------|------|
| ユーザーへの影響 | [ゲームプレイ不可 / セーブ失敗 / パフォーマンス低下 等] |
| SLO への影響 | [違反した SLO ID と実測値: 例 SLO-001 FPS 22% < 95%] |
| エラーバジェット消費 | [消費したバジェット量: 例 月間バジェットの 35% 消費] |
| データ損失 | [有 / 無 / 推定件数] |
| セキュリティへの影響 | [有 / 無 / 詳細] |

---

#### 5. 対応した内容

**即時対応（Mitigation）**:
- [ロールバック / サービス停止 / ユーザー通知 等]

**根本対応（Fix）**:
- [実装した修正内容、該当コミットへの参照]
- PR リンク: [GitHub PR URL]

---

#### 6. 再発防止アクション

| アクション | 種別 | 担当者 | 期限 | 優先度 |
|-----------|------|-------|------|--------|
| [具体的な改善アクション 1] | 予防 / 検知 / 対応 | [氏名] | YYYY-MM-DD | High / Medium / Low |
| [具体的な改善アクション 2] | 予防 / 検知 / 対応 | [氏名] | YYYY-MM-DD | High / Medium / Low |
| [具体的な改善アクション 3] | 予防 / 検知 / 対応 | [氏名] | YYYY-MM-DD | High / Medium / Low |

---

#### 7. 学んだこと（Lessons Learned）

**良かった点**（うまく機能した手順・ツール）:
- [例: FpsMonitor のアラートが問題を素早く検知できた]

**改善すべき点**:
- [例: ローカルで再現するまで 30 分かかった → 再現手順書が必要]

**今後の提案**:
- [例: ステージ遷移後のメモリ回帰テストを CI に追加する]

---

## 5. 参考: SLO 閾値クイックリファレンス

| SLO ID | 指標 | 目標値 | 違反時の Severity |
|--------|------|--------|-----------------|
| SLO-001 | FPS 安定性 | >= 95%（30s ウィンドウ） | SEV2（恒常的） / SEV3（断続） |
| SLO-002 | 初期ロード P95 | <= 3,000ms（4G） / <= 5,000ms（50Mbps） | SEV2 |
| SLO-003 | 入力遅延 P99 | <= 16ms | SEV3 |
| SLO-004 | レベルロード P95 | <= 1,000ms | SEV3 |
| SLO-005 | セーブ/ロード成功率 | >= 99.9% | SEV2 |
| SLO-006 | クラッシュ率 | <= 0.1% / セッション | SEV1（全体クラッシュ） / SEV2（特定ケース） |
| SLO-007 | バンドルサイズ | <= 10MB | SEV3（デプロイ時のみ） |
| SLO-008 | テストカバレッジ | >= 80% | SEV3（CI ブロック） |
| SLO-009 | TypeScript 型エラー | = 0 | SEV2（CI ブロック） |
| SLO-010 | ESLint エラー | = 0 | SEV3（CI ブロック） |

---

## 改訂履歴

| バージョン | 日付 | 変更内容 |
|----------|------|---------|
| 1.0.0 | 2026-03-20 | 初版作成（INC-001〜006、ロールバック、ポストモーテムテンプレート） |
