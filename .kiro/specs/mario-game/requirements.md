# Requirements: mario-game

## 0. 目的

本ドキュメントは、マリオ風2Dプラットフォーマーゲーム（ブラウザ/Web版）の機能要件・非機能要件・セキュリティ要件・運用要件を EARS 準拠で定義する。全要件は GWT 形式の受入テストを持ち、Yes/No で判定可能である。本仕様書に基づき設計（design.md）・タスク分解（tasks.md）・脅威モデル（threat-model.md）を導出する。

## 1. 概要

ブラウザ上で動作するマリオ風2Dプラットフォーマーゲーム。TypeScript + Phaser 3.88.x を基盤とし、キーボード操作によるプレイヤー移動・ジャンプ・敵踏みつけ・アイテム取得を実装する。GitHub Pages または Vercel 上に静的ファイルとしてホスティングし、月額コスト $0 で運用する。

---

## 2. 背景 & Context

Web 技術の教育・セミナー用途として、ゲーム開発の実例を示すデモプロジェクトが必要とされている。既存の Flash ゲームや Unity WebGL ビルドに依存せず、モダンな TypeScript エコシステムのみで完結するブラウザゲームを構築することで、フロントエンド技術習得の参考事例とする。

---

## 3. スコープ

### 3.1 In Scope

- プレイヤーキャラクターの移動・ジャンプ・攻撃（踏みつけ）操作
- Tiled Map Editor で作成した 2D タイルマップの読み込みとレンダリング
- 敵キャラクター（歩行型・砲台型）の AI 挙動
- コイン・パワーアップアイテムの収集とスコア加算
- タイトル画面・ゲームオーバー画面・ステージクリア画面の UI
- BGM・SE の再生（Howler.js）
- ローカルストレージを用いたハイスコア保存
- GitHub Pages / Vercel への静的ホスティング
- PC ブラウザ（Chrome 120+、Firefox 120+、Safari 17+）対応

### 3.2 Out of Scope

- モバイル・タッチ操作への対応（Phase 2 以降）
- マルチプレイヤー・オンライン通信機能
- ユーザーアカウント・サーバーサイドデータ保存
- ステージエディタ機能のエンドユーザー公開
- iOS / Android ネイティブアプリ化
- ゲームパッド・コントローラー対応（Phase 2 以降）
- 課金・広告機能

---

## 4. 用語集

| 用語 | 定義 |
|------|------|
| プレイヤー | ユーザーが操作するキャラクター |
| タイルマップ | Tiled Map Editor で作成した JSON 形式のレベルデータ |
| グラウンド衝突 | プレイヤーまたは敵がタイル上面に接触している状態 |
| コイン | 取得するとスコアが 100 加算されるアイテム |
| スーパーマッシュルーム | 取得するとプレイヤーが大きくなるパワーアップアイテム |
| ファイアフラワー | 取得するとファイアボール発射能力を付与するアイテム |
| グーパ | 歩行する基本敵キャラクター（左右に往復移動） |
| コパトロ | 亀型敵キャラクター（踏むと甲羅になる） |
| ライフ | プレイヤーの残機数（初期値 3） |
| HP | パワーアップ状態を示す値（通常 1、大きい状態 2、ファイア状態 3） |
| セーブデータ | ローカルストレージに保存するハイスコア・ステージ進行データ |
| シーン | Phaser 3 のシーン（TitleScene、GameScene、UIScene 等） |
| Arcade Physics | Phaser 3 に内蔵された AABB ベース物理演算システム |

---

## 5. ステークホルダー & 役割

| ステークホルダー | 役割 |
|----------------|------|
| セミナー主催者 | プロジェクトオーナー。要件の最終承認者 |
| 受講者（開発者） | 実装を担当するエンジニア |
| セミナー参加者 | エンドユーザー。ブラウザでゲームをプレイする |
| コードレビュアー | プルリクエストのレビューを担当するエンジニア |

---

## 6. 前提/仮定（Assumptions）

| ID | 前提・仮定 | 影響 |
|----|-----------|------|
| ASM-001 | プレイヤーは PC キーボードを使用することを前提とする | タッチ操作は Out of Scope |
| ASM-002 | ブラウザは WebGL をサポートしていることを前提とする | Canvas 2D フォールバックは実装しない |
| ASM-003 | Tiled Map Editor の tilemap JSON フォーマットは Phaser 3 互換であることを前提とする | 独自パーサー実装は不要 |
| ASM-004 | ホスティング先（GitHub Pages / Vercel）は HTTPS を提供することを前提とする | HTTP からの Web Audio API 利用制限を回避 |
| ASM-005 | ゲームアセット（スプライト・BGM）は著作権フリーまたは自作のものを使用することを前提とする | ライセンス調査コストなし |
| ASM-006 | ローカルストレージは 5MB 以内に収まることを前提とする | IndexedDB 実装は不要 |
| ASM-007 | Phase 1 では同時接続ユーザー数の制限なし（静的ファイルのため） | スケーリング考慮不要 |

---

## 7. 制約（Constraints）

| ID | 制約 | 理由 |
|----|------|------|
| CON-001 | 月額インフラコストは $0 であること | セミナー予算制約 |
| CON-002 | TypeScript strict モードを有効にすること | 型安全性の担保 |
| CON-003 | Phaser 3.88.x を使用すること | 指定技術スタック |
| CON-004 | ビルドツールは Vite を使用すること | 指定技術スタック |
| CON-005 | ソースコードは GitHub リポジトリで管理すること | セミナー教材としての公開 |
| CON-006 | ゲームの初期ロード時間は 50Mbps 固定回線で 5 秒以内であること | プレイアビリティ確保 |
| CON-007 | 1 ソースファイルあたり最大 400 行とすること | コード品質維持 |

---

## 8. 成功条件（Success Metrics）

| ID | 指標 | 目標値 | 計測方法 |
|----|------|--------|---------|
| SM-001 | 初期ロード時間（50Mbps 固定回線） | 5 秒以内 | Chrome DevTools Network タブ |
| SM-002 | フレームレート（Core i5 相当 PC） | 60fps 維持率 95% 以上 | Chrome DevTools Performance タブ |
| SM-003 | TypeScript コンパイルエラー数 | 0 件 | tsc --noEmit |
| SM-004 | 単体テストカバレッジ | 80% 以上 | Vitest coverage |
| SM-005 | Lighthouse Performance スコア | 85 以上 | Chrome Lighthouse |
| SM-006 | ブラウザ互換性 | Chrome 120+、Firefox 120+、Safari 17+ で動作 | 手動動作確認 |
| SM-007 | ゲームクリア可能性 | ステージ 1-1 〜 1-4 をクリアできること | 手動動作確認 |

---

## 9. 機能要件

### カテゴリ: プレイヤー操作（REQ-001〜010）

---

**REQ-001**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player presses the ArrowRight or D key, the system shall move the player character to the right at 200px/s horizontal velocity.
- 受入テスト(GWT):
  - Given: プレイヤーがグラウンドに接地している
  - When: ArrowRight キーを押下する
  - Then: プレイヤーキャラクターが右方向へ 200px/s で移動する
- 例外・エラー: If プレイヤーが壁タイルに衝突した場合, then 水平速度を 0 にしてキャラクターを停止させる

---

**REQ-002**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player presses the ArrowLeft or A key, the system shall move the player character to the left at 200px/s horizontal velocity.
- 受入テスト(GWT):
  - Given: プレイヤーがグラウンドに接地している
  - When: ArrowLeft キーを押下する
  - Then: プレイヤーキャラクターが左方向へ 200px/s で移動する
- 例外・エラー: If プレイヤーが左端の壁タイルに衝突した場合, then 水平速度を 0 にして停止させる

---

**REQ-003**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player presses the Space or ArrowUp key while grounded, the system shall apply a vertical impulse of -600px/s to the player character.
- 受入テスト(GWT):
  - Given: プレイヤーが地面に接地している（isGrounded = true）
  - When: Space キーを押下する
  - Then: 垂直速度に -600px/s のインパルスが付与され、プレイヤーが上方向へ移動する
- 例外・エラー: If プレイヤーが空中にいる場合, then ジャンプ入力を無視する

---

**REQ-004**
- 種別: EARS-状態駆動
- 優先度: MUST
- 要件文: While the player character is airborne, the system shall apply gravitational acceleration of 980px/s² downward.
- 受入テスト(GWT):
  - Given: プレイヤーがジャンプして空中にいる
  - When: フレームが経過する
  - Then: 垂直速度が毎フレーム 980px/s² × delta の割合で増加し、プレイヤーが下降する
- 例外・エラー: If 垂直速度が最大落下速度 800px/s を超えた場合, then 800px/s に制限する

---

**REQ-005**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player character's bottom boundary collides with the top face of a ground tile, the system shall set the player's vertical velocity to 0 and set isGrounded to true.
- 受入テスト(GWT):
  - Given: プレイヤーが落下中（垂直速度 > 0）
  - When: プレイヤー下端がグラウンドタイル上面と衝突する
  - Then: 垂直速度が 0 になり、isGrounded フラグが true になる
- 例外・エラー: If タイルが platform レイヤーではなく decoration レイヤーの場合, then 衝突判定を行わない

---

**REQ-006**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player character falls below the stage lower boundary (y > mapHeight + 64px), the system shall trigger the player death sequence.
- 受入テスト(GWT):
  - Given: プレイヤーが穴に落ちた（y 座標 > mapHeight + 64px）
  - When: フレーム更新処理が実行される
  - Then: 死亡アニメーションが再生され、ライフが 1 減算される
- 例外・エラー: If ライフが 0 になった場合, then ゲームオーバー画面へ遷移する

---

**REQ-007**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player character's bottom boundary collides with the top boundary of an enemy, the system shall kill the enemy and apply a bounce impulse of -400px/s to the player.
- 受入テスト(GWT):
  - Given: プレイヤーが敵の真上から落下している（プレイヤー垂直速度 > 0）
  - When: プレイヤー下端が敵の上端と衝突する
  - Then: 敵が死亡状態になり、プレイヤーに垂直 -400px/s のバウンスが付与される
- 例外・エラー: If 衝突がプレイヤーの側面または下面からの場合, then プレイヤーにダメージを与える

---

**REQ-008**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player character collides laterally with an enemy, the system shall reduce the player's HP by 1 and trigger the invincibility state for 2 seconds.
- 受入テスト(GWT):
  - Given: プレイヤーが通常状態（HP >= 1）
  - When: プレイヤーが敵の左側面または右側面に触れる
  - Then: HP が 1 減少し、2 秒間の無敵状態（点滅表示）が開始される
- 例外・エラー: If 無敵状態中に再度敵に触れた場合, then ダメージを与えない

---

**REQ-009**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player HP reaches 0, the system shall play the death sound effect, decrement lives by 1, and restart the current stage after 2 seconds.
- 受入テスト(GWT):
  - Given: プレイヤーの HP が 1 の状態
  - When: 敵に衝突して HP が 0 になる
  - Then: 死亡 SE が再生され、ライフが 1 減り、2 秒後に現在ステージが再スタートする
- 例外・エラー: If ライフが 0 になった場合, then ステージ再スタートではなくゲームオーバー画面へ遷移する

---

**REQ-010**
- 種別: EARS-状態駆動
- 優先度: SHOULD
- 要件文: While the player is in the running state (horizontal velocity > 0), the system shall play the running animation at a frame rate of 8fps.
- 受入テスト(GWT):
  - Given: プレイヤーが移動キーを押している
  - When: 水平速度が 0 より大きい
  - Then: 走りアニメーション（8fps）が再生される
- 例外・エラー: If プレイヤーが空中にいる場合, then 走りアニメーションではなくジャンプアニメーションを再生する

---

### カテゴリ: レベル・マップ（REQ-011〜020）

---

**REQ-011**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the GameScene is initialized, the system shall load the Tiled JSON tilemap file and render ground, platform, and decoration layers at 16×16px tile resolution.
- 受入テスト(GWT):
  - Given: GameScene が開始された
  - When: preload および create メソッドが実行される
  - Then: タイルマップの全レイヤーが画面に描画される（ground, platform, decoration）
- 例外・エラー: If tilemap JSON ファイルの読み込みに失敗した場合, then エラーログを出力してタイトル画面に戻る

---

**REQ-012**
- 種別: EARS-普遍
- 優先度: MUST
- 要件文: The system shall support a minimum of 4 stages (1-1, 1-2, 1-3, 1-4) as separate Tiled JSON files.
- 受入テスト(GWT):
  - Given: ゲームがビルドされている
  - When: 各ステージの JSON ファイルパスを確認する
  - Then: stage-1-1.json, stage-1-2.json, stage-1-3.json, stage-1-4.json が存在する
- 例外・エラー: If ステージ JSON が欠損している場合, then ビルドエラーとして検出する

---

**REQ-013**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player reaches the goal flag object defined in the tilemap, the system shall trigger the stage clear sequence and load the next stage within 3 seconds.
- 受入テスト(GWT):
  - Given: プレイヤーがステージの最後にいる
  - When: プレイヤーが goal_flag オブジェクトに接触する
  - Then: ステージクリア音楽が再生され、3 秒以内に次のステージが読み込まれる
- 例外・エラー: If 最終ステージ（1-4）をクリアした場合, then エンディング画面へ遷移する

---

**REQ-014**
- 種別: EARS-普遍
- 優先度: MUST
- 要件文: The system shall scroll the camera horizontally to follow the player character, keeping the player within the center 40% of the viewport width.
- 受入テスト(GWT):
  - Given: プレイヤーがステージ右方向へ移動している
  - When: プレイヤーがビューポート中央 40% の右端を超える
  - Then: カメラが右方向にスクロールしてプレイヤーを追従する
- 例外・エラー: If プレイヤーがマップ右端に到達した場合, then カメラのスクロールをマップ境界で停止する

---

**REQ-015**
- 種別: EARS-普遍
- 優先度: MUST
- 要件文: The system shall prevent the camera from scrolling beyond the left boundary of the tilemap (x < 0).
- 受入テスト(GWT):
  - Given: プレイヤーがステージ左端付近にいる
  - When: プレイヤーが左方向へ移動する
  - Then: カメラの左端座標は 0 未満にならない
- 例外・エラー: If プレイヤーが左端から更に左へ移動しようとした場合, then プレイヤーの水平速度を 0 にする

---

**REQ-016**
- 種別: EARS-普遍
- 優先度: MUST
- 要件文: The system shall render parallax background layers at 0.3x scroll speed relative to the camera movement.
- 受入テスト(GWT):
  - Given: カメラが 100px 右へ移動した
  - When: フレームを描画する
  - Then: 背景レイヤーは 30px だけ右へオフセットして描画される
- 例外・エラー: なし

---

**REQ-017**
- 種別: EARS-イベント駆動
- 優先度: SHOULD
- 要件文: When the player enters a pipe entrance object defined in the tilemap, the system shall transition the player to the underground sub-stage within 1 second.
- 受入テスト(GWT):
  - Given: プレイヤーがパイプ入口オブジェクトの上に立っている
  - When: 下キーを 1 秒間押し続ける
  - Then: フェードアウトしてサブステージのシーンに遷移する
- 例外・エラー: If サブステージ JSON が存在しない場合, then パイプ入口に反応しない

---

**REQ-018**
- 種別: EARS-普遍
- 優先度: SHOULD
- 要件文: The system shall display a stage timer counting down from 400 seconds and update it every 1 second.
- 受入テスト(GWT):
  - Given: ステージが開始した（タイマー 400）
  - When: 1 秒経過する
  - Then: 画面上部のタイマー表示が 399 になる
- 例外・エラー: If タイマーが 0 になった場合, then プレイヤーの死亡シーケンスを発動する

---

**REQ-019**
- 種別: EARS-イベント駆動
- 優先度: SHOULD
- 要件文: When the stage timer reaches 100 seconds, the system shall change the BGM tempo to 1.5x playback speed.
- 受入テスト(GWT):
  - Given: ステージが進行中
  - When: タイマーが 100 になる
  - Then: BGM の再生速度が 1.5 倍になり、警告 SE が 1 回再生される
- 例外・エラー: If BGM が既に 1.5x で再生中の場合, then 再設定しない

---

**REQ-020**
- 種別: EARS-普遍
- 優先度: SHOULD
- 要件文: The system shall load tilemap assets asynchronously during a loading screen and display a progress bar updated every 10% of load completion.
- 受入テスト(GWT):
  - Given: ゲームが起動した
  - When: アセットのロードが開始する
  - Then: ローディング画面にプログレスバーが表示され、10% 刻みで更新される
- 例外・エラー: If ネットワークタイムアウト（30 秒）が発生した場合, then エラーメッセージを表示してリロードボタンを表示する

---

### カテゴリ: 敵・障害物（REQ-021〜030）

---

**REQ-021**
- 種別: EARS-状態駆動
- 優先度: MUST
- 要件文: While a Goomba enemy is alive, the system shall move it horizontally at 60px/s and reverse direction upon colliding with a wall tile or platform edge.
- 受入テスト(GWT):
  - Given: グーパが生存状態でステージ上にいる
  - When: グーパが壁タイルの左面に衝突する
  - Then: 水平速度の符号が反転し、反対方向に 60px/s で移動する
- 例外・エラー: If グーパがプラットフォームの端に達した場合, then 同様に方向転換する

---

**REQ-022**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player stomps a Goomba (bottom collision), the system shall play the stomp sound effect, set the Goomba to the dead state, and remove it from the scene after 0.5 seconds.
- 受入テスト(GWT):
  - Given: グーパが生存状態
  - When: プレイヤーがグーパの上端に踏みつけ衝突する
  - Then: 踏みつけ SE が再生され、グーパが潰れアニメーションを 0.5 秒再生後にシーンから削除される
- 例外・エラー: If グーパがすでに dead 状態の場合, then プレイヤーとの衝突判定を無効化する

---

**REQ-023**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When a Koopa Troopa is stomped, the system shall transition it to the shell state, set shell horizontal velocity to 0, and allow the player to kick the shell.
- 受入テスト(GWT):
  - Given: コパトロが歩行状態
  - When: プレイヤーが踏みつける
  - Then: 甲羅状態に遷移し、静止する。その後プレイヤーが甲羅に触れると 400px/s の速度で飛んでいく
- 例外・エラー: If 甲羅が他の敵に衝突した場合, then その敵を死亡状態にする

---

**REQ-024**
- 種別: EARS-普遍
- 優先度: MUST
- 要件文: The system shall add 200 points to the score when a Goomba is defeated, and 100 points when a Koopa shell hits an enemy.
- 受入テスト(GWT):
  - Given: スコアが 0
  - When: グーパを踏みつける
  - Then: スコアに 200 が加算される
- 例外・エラー: なし

---

**REQ-025**
- 種別: EARS-普遍
- 優先度: MUST
- 要件文: The system shall only activate enemies within 2 tile widths (512px) from the camera viewport boundary to limit CPU usage.
- 受入テスト(GWT):
  - Given: カメラビューポートが x=0〜800px の範囲
  - When: 敵の x 座標が -512px 未満または 1312px 超の場合
  - Then: その敵の update 処理（AI 移動・衝突判定）をスキップする
- 例外・エラー: なし

---

**REQ-026**
- 種別: EARS-状態駆動
- 優先度: SHOULD
- 要件文: While a Piranha Plant is in the extended state, the system shall deal damage to the player on lateral or downward collision.
- 受入テスト(GWT):
  - Given: パックンフラワーが伸び上がった状態（extended = true）
  - When: プレイヤーが左右または下方向から接触する
  - Then: プレイヤーの HP が 1 減少し、無敵状態になる
- 例外・エラー: If プレイヤーが無敵状態中の場合, then ダメージを与えない

---

**REQ-027**
- 種別: EARS-イベント駆動
- 優先度: SHOULD
- 要件文: When a fireball projectile collides with a Goomba or Koopa, the system shall kill the enemy and remove the fireball from the scene.
- 受入テスト(GWT):
  - Given: ファイアボールが飛行中、グーパが生存中
  - When: ファイアボールがグーパのヒットボックスに衝突する
  - Then: グーパが死亡し、ファイアボールがシーンから削除される
- 例外・エラー: If ファイアボールがタイルに衝突した場合, then ファイアボールのみ削除する

---

**REQ-028**
- 種別: EARS-イベント駆動
- 優先度: SHOULD
- 要件文: When the player presses the B or Z key while in the fire state, the system shall spawn a fireball at the player's position with horizontal velocity 400px/s in the facing direction.
- 受入テスト(GWT):
  - Given: プレイヤーがファイア状態（HP = 3）
  - When: B キーを押下する
  - Then: ファイアボールがプレイヤーの向き方向へ 400px/s で発射される
- 例外・エラー: If 同時に存在するファイアボールが 2 個以上の場合, then 新規発射を無効化する

---

**REQ-029**
- 種別: EARS-普遍
- 優先度: COULD
- 要件文: The system shall render enemy sprites with a flip animation when direction changes, completing the flip within 1 frame (16ms at 60fps).
- 受入テスト(GWT):
  - Given: グーパが移動中
  - When: 壁衝突により方向転換する
  - Then: スプライトの flipX が 1 フレーム以内に更新される
- 例外・エラー: なし

---

**REQ-030**
- 種別: EARS-イベント駆動
- 優先度: COULD
- 要件文: When a Koopa shell travels at 400px/s and collides with a wall tile, the system shall reverse the shell's horizontal direction.
- 受入テスト(GWT):
  - Given: 甲羅が 400px/s で移動中
  - When: 壁タイルに衝突する
  - Then: 水平速度の符号が反転し、逆方向へ 400px/s で移動する
- 例外・エラー: If 甲羅が穴に落ちた場合, then シーンから削除する

---

### カテゴリ: アイテム・スコア（REQ-031〜040）

---

**REQ-031**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player collides with a coin sprite, the system shall remove the coin from the scene, add 100 to the score, and increment the coin counter by 1.
- 受入テスト(GWT):
  - Given: コインがステージ上に存在する
  - When: プレイヤーのヒットボックスがコインのヒットボックスと重なる
  - Then: コインが消え、スコア +100、コインカウンター +1 が画面に反映される
- 例外・エラー: なし

---

**REQ-032**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the coin counter reaches 100, the system shall reset the coin counter to 0 and add 1 to the player's lives.
- 受入テスト(GWT):
  - Given: コインカウンターが 99
  - When: コインを 1 枚取得する
  - Then: コインカウンターが 0 にリセットされ、ライフが 1 増加する
- 例外・エラー: If ライフが最大値（99）に達している場合, then ライフを増加させない

---

**REQ-033**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player hits a question block from below, the system shall reveal the contained item (coin or power-up) and change the block to an empty state.
- 受入テスト(GWT):
  - Given: ハテナブロックがアイテムを含んでいる
  - When: プレイヤーがブロック底面に頭突き衝突する
  - Then: アイテムがブロック上部から出現し、ブロックが空（使用済み）状態になる
- 例外・エラー: If ブロックがすでに空状態の場合, then 何も出現させない

---

**REQ-034**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player collides with a Super Mushroom, the system shall set the player HP to 2, play the power-up sound, and update the player sprite to the large variant.
- 受入テスト(GWT):
  - Given: プレイヤーが通常状態（HP = 1）
  - When: スーパーマッシュルームに触れる
  - Then: HP が 2 になり、パワーアップ SE が再生され、大きいスプライトに切り替わる
- 例外・エラー: If プレイヤーがすでに HP 2 以上の場合, then スコアに 1000 加算するのみ

---

**REQ-035**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player collides with a Fire Flower, the system shall set the player HP to 3, play the power-up sound, and update the player sprite to the fire variant.
- 受入テスト(GWT):
  - Given: プレイヤーが HP 2 状態
  - When: ファイアフラワーに触れる
  - Then: HP が 3 になり、パワーアップ SE が再生され、ファイアスプライトに切り替わる
- 例外・エラー: If プレイヤーがすでに HP 3 の場合, then スコアに 1000 加算するのみ

---

**REQ-036**
- 種別: EARS-普遍
- 優先度: SHOULD
- 要件文: The system shall display the current score, coin count, remaining lives, world number, and timer in the HUD at all times during gameplay.
- 受入テスト(GWT):
  - Given: ゲームプレイ中
  - When: 画面を観察する
  - Then: 画面上部に スコア・コイン数・ライフ数・ワールド番号・タイマーが常時表示されている
- 例外・エラー: なし

---

**REQ-037**
- 種別: EARS-イベント駆動
- 優先度: SHOULD
- 要件文: When the player collides with a 1-UP Mushroom, the system shall add 1 to the player's lives and play the 1-UP sound effect.
- 受入テスト(GWT):
  - Given: プレイヤーが 1UP キノコを取得する
  - When: 衝突判定が成立する
  - Then: ライフが 1 増加し、1UP SE が再生される
- 例外・エラー: If ライフが 99 の場合, then ライフを増加させずに SE のみ再生する

---

**REQ-038**
- 種別: EARS-イベント駆動
- 優先度: SHOULD
- 要件文: When the stage clear bonus calculation begins, the system shall add (remaining_timer × 50) points to the score and animate the timer counting down to 0.
- 受入テスト(GWT):
  - Given: ステージクリア時のタイマーが 200
  - When: ボーナス計算が実行される
  - Then: スコアに 10000（200 × 50）が加算され、タイマーが 200 から 0 まで 2 秒かけてカウントダウンするアニメーションが再生される
- 例外・エラー: なし

---

**REQ-039**
- 種別: EARS-イベント駆動
- 優先度: COULD
- 要件文: When the player defeats multiple enemies consecutively without touching the ground, the system shall multiply the score bonus by 2 for each successive defeat (cap at 8x).
- 受入テスト(GWT):
  - Given: プレイヤーが空中でグーパを踏んだ（1 体目: 200pt）
  - When: 地面に触れずに 2 体目を踏む
  - Then: 2 体目のスコアは 400pt（2x）、3 体目は 800pt（4x）になる
- 例外・エラー: If プレイヤーが地面に触れた場合, then 連続踏み係数を 1x にリセットする

---

**REQ-040**
- 種別: EARS-イベント駆動
- 優先度: COULD
- 要件文: When the player collects a Starman, the system shall set the player to the invincible state for 10 seconds, play the starman BGM, and allow defeating enemies on contact.
- 受入テスト(GWT):
  - Given: プレイヤーがスターマンを取得する
  - When: スターマンに衝突する
  - Then: 10 秒間の無敵状態になり、スターマン BGM が再生され、接触した敵が自動的に死亡する
- 例外・エラー: If 無敵時間が終了した場合, then 元の BGM に戻る

---

### カテゴリ: UI・メニュー（REQ-041〜050）

---

**REQ-041**
- 種別: EARS-普遍
- 優先度: MUST
- 要件文: The system shall display a title screen with a "PLAY" button and a "HIGH SCORE" display on initial load.
- 受入テスト(GWT):
  - Given: ブラウザでゲームの URL を開く
  - When: 初期ロードが完了する
  - Then: タイトル画面に "PLAY" ボタンとハイスコア表示が表示される
- 例外・エラー: なし

---

**REQ-042**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player clicks the "PLAY" button on the title screen, the system shall transition to Stage 1-1 within 1 second.
- 受入テスト(GWT):
  - Given: タイトル画面が表示されている
  - When: "PLAY" ボタンをクリックする
  - Then: 1 秒以内にステージ 1-1 の GameScene に遷移する
- 例外・エラー: なし

---

**REQ-043**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player's lives reach 0, the system shall display the game over screen with the final score and a "RETRY" button.
- 受入テスト(GWT):
  - Given: プレイヤーのライフが 0 になった
  - When: 死亡シーケンスが完了する
  - Then: ゲームオーバー画面が表示され、最終スコアと "RETRY" ボタンが表示される
- 例外・エラー: なし

---

**REQ-044**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player clicks "RETRY" on the game over screen, the system shall reset all game state (score=0, lives=3, HP=1) and restart from Stage 1-1.
- 受入テスト(GWT):
  - Given: ゲームオーバー画面が表示されている
  - When: "RETRY" ボタンをクリックする
  - Then: スコア・ライフ・HP がリセットされ、ステージ 1-1 から再開する
- 例外・エラー: なし

---

**REQ-045**
- 種別: EARS-イベント駆動
- 優先度: SHOULD
- 要件文: When the player presses the Escape key during gameplay, the system shall display a pause menu with "RESUME" and "QUIT" options, and freeze all game object updates.
- 受入テスト(GWT):
  - Given: ゲームプレイ中
  - When: Escape キーを押す
  - Then: ポーズメニューが表示され、敵・プレイヤー・タイマーの更新が停止する
- 例外・エラー: If ポーズ中に再度 Escape を押した場合, then ポーズを解除してゲームを再開する

---

**REQ-046**
- 種別: EARS-イベント駆動
- 優先度: SHOULD
- 要件文: When the player completes Stage 1-4 (the final stage), the system shall display the ending screen with the total score and play time in seconds.
- 受入テスト(GWT):
  - Given: ステージ 1-4 のゴールフラグに到達した
  - When: ステージクリア演出が完了する
  - Then: エンディング画面に合計スコアとプレイ時間（秒）が表示される
- 例外・エラー: なし

---

**REQ-047**
- 種別: EARS-普遍
- 優先度: SHOULD
- 要件文: The system shall display a world/stage transition screen (e.g., "WORLD 1-2") for 2 seconds between stages.
- 受入テスト(GWT):
  - Given: ステージ 1-1 をクリアした
  - When: 次のステージ（1-2）に遷移する
  - Then: "WORLD 1-2" と表示されたトランジション画面が 2 秒間表示される
- 例外・エラー: なし

---

**REQ-048**
- 種別: EARS-普遍
- 優先度: SHOULD
- 要件文: The system shall render all UI text using a pixel-art bitmap font at size 16px or 32px to maintain the retro aesthetic.
- 受入テスト(GWT):
  - Given: タイトル画面・HUD・ゲームオーバー画面が表示されている
  - When: テキスト要素を検査する
  - Then: 全テキストがビットマップフォント（16px または 32px）で描画されている
- 例外・エラー: If ビットマップフォントの読み込みに失敗した場合, then フォールバックとしてシステムフォント "monospace" を使用する

---

**REQ-049**
- 種別: EARS-イベント駆動
- 優先度: COULD
- 要件文: When the player hovers over a button in the menu, the system shall change the button color from white (#FFFFFF) to yellow (#FFFF00) within 1 frame.
- 受入テスト(GWT):
  - Given: タイトル画面またはゲームオーバー画面が表示されている
  - When: マウスカーソルがボタン上に移動する
  - Then: ボタンのテキスト色が黄色 (#FFFF00) になる
- 例外・エラー: なし

---

**REQ-050**
- 種別: EARS-イベント駆動
- 優先度: COULD
- 要件文: When a score milestone of 10,000 points is reached, the system shall display a "+10000 BONUS" popup text at the player's position for 1 second.
- 受入テスト(GWT):
  - Given: スコアが 9,900 の状態
  - When: 100pt 加算されてスコアが 10,000 を超える
  - Then: プレイヤー座標に "+10000 BONUS" テキストが 1 秒間表示される
- 例外・エラー: なし

---

### カテゴリ: 音声・エフェクト（REQ-051〜058）

---

**REQ-051**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the GameScene starts, the system shall begin playing the stage BGM loop using Howler.js at volume 0.7.
- 受入テスト(GWT):
  - Given: GameScene が作成された
  - When: create メソッドが完了する
  - Then: Howler.js によるステージ BGM がボリューム 0.7 でループ再生される
- 例外・エラー: If ブラウザの自動再生ポリシーにより再生がブロックされた場合, then 最初のユーザー操作後に再生を開始する

---

**REQ-052**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player collects a coin, the system shall play the coin sound effect (coin.wav) at volume 1.0 without interrupting the BGM.
- 受入テスト(GWT):
  - Given: BGM が再生中
  - When: プレイヤーがコインを取得する
  - Then: コイン SE（coin.wav）がボリューム 1.0 で再生され、BGM は途切れない
- 例外・エラー: なし

---

**REQ-053**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player dies, the system shall stop the stage BGM and play the death jingle (death.wav) once.
- 受入テスト(GWT):
  - Given: ステージ BGM が再生中
  - When: プレイヤーの HP が 0 になる
  - Then: ステージ BGM が停止し、death.wav が 1 回再生される
- 例外・エラー: なし

---

**REQ-054**
- 種別: EARS-イベント駆動
- 優先度: SHOULD
- 要件文: When the player jumps, the system shall play the jump sound effect (jump.wav) at volume 0.8.
- 受入テスト(GWT):
  - Given: プレイヤーが接地している
  - When: Space キーを押してジャンプする
  - Then: jump.wav がボリューム 0.8 で再生される
- 例外・エラー: If jump.wav の読み込みに失敗した場合, then SE 再生をスキップしてゲームを続行する

---

**REQ-055**
- 種別: EARS-イベント駆動
- 優先度: SHOULD
- 要件文: When the player stomps an enemy, the system shall play the stomp sound effect (stomp.wav) at volume 0.9.
- 受入テスト(GWT):
  - Given: グーパが生存中
  - When: プレイヤーが踏みつける
  - Then: stomp.wav がボリューム 0.9 で再生される
- 例外・エラー: なし

---

**REQ-056**
- 種別: EARS-イベント駆動
- 優先度: SHOULD
- 要件文: When the player takes damage, the system shall play the damage sound effect (damage.wav) and flash the player sprite at 10Hz for 2 seconds.
- 受入テスト(GWT):
  - Given: プレイヤーが通常状態
  - When: 敵に接触してダメージを受ける
  - Then: damage.wav が再生され、プレイヤースプライトが 2 秒間 10Hz で点滅する
- 例外・エラー: なし

---

**REQ-057**
- 種別: EARS-普遍
- 優先度: COULD
- 要件文: The system shall provide a mute toggle button in the pause menu that sets all audio volumes to 0 when activated.
- 受入テスト(GWT):
  - Given: ポーズメニューが表示されている
  - When: "MUTE" ボタンをクリックする
  - Then: Howler.volume(0) が呼ばれ、全音声が無音になる
- 例外・エラー: If ミュート中に再度 "MUTE" をクリックした場合, then ボリュームを 0.7 に戻す

---

**REQ-058**
- 種別: EARS-イベント駆動
- 優先度: COULD
- 要件文: When a particle effect (coin sparkle, enemy death) is triggered, the system shall spawn 8 particles with random velocity vectors in the range ±150px/s and fade them out over 0.5 seconds.
- 受入テスト(GWT):
  - Given: コインを取得した
  - When: 取得イベントが発火する
  - Then: 8 個のパーティクルがコイン座標から±150px/s のランダム速度で飛散し、0.5 秒でフェードアウトする
- 例外・エラー: なし

---

### カテゴリ: セーブ・データ（REQ-059〜063）

---

**REQ-059**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the player achieves a score higher than the stored high score, the system shall write the new high score to localStorage under the key "mario_highscore".
- 受入テスト(GWT):
  - Given: localStorage["mario_highscore"] = 5000
  - When: ゲームオーバー時のスコアが 8000 になる
  - Then: localStorage["mario_highscore"] が 8000 に更新される
- 例外・エラー: If localStorage へのアクセスが拒否された場合（プライベートモード等）, then エラーを catch してセーブをスキップする

---

**REQ-060**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the title screen loads, the system shall read "mario_highscore" from localStorage and display the value in the HIGH SCORE field.
- 受入テスト(GWT):
  - Given: localStorage["mario_highscore"] = 12000
  - When: タイトル画面が表示される
  - Then: HIGH SCORE フィールドに "12000" が表示される
- 例外・エラー: If localStorage["mario_highscore"] が存在しない場合, then "00000" を表示する

---

**REQ-061**
- 種別: EARS-イベント駆動
- 優先度: MUST
- 要件文: When the game state is saved, the system shall serialize score, lives, current_stage, and coin_count as a JSON string and store it under the key "mario_save".
- 受入テスト(GWT):
  - Given: ステージ 1-2 クリア直後（スコア 3000、ライフ 3、コイン 25）
  - When: セーブ処理が実行される
  - Then: localStorage["mario_save"] = '{"score":3000,"lives":3,"stage":"1-3","coins":25}' が保存される
- 例外・エラー: If localStorage の空き容量が不足している場合, then エラーログを出力してセーブをスキップする

---

**REQ-062**
- 種別: EARS-イベント駆動
- 優先度: SHOULD
- 要件文: When the player clicks "CONTINUE" on the title screen, the system shall load "mario_save" from localStorage and resume from the saved stage with the saved score and lives.
- 受入テスト(GWT):
  - Given: localStorage["mario_save"] が存在する
  - When: "CONTINUE" ボタンをクリックする
  - Then: 保存されたステージ・スコア・ライフでゲームが再開する
- 例外・エラー: If localStorage["mario_save"] が壊れた JSON の場合, then セーブデータを削除して 1-1 から開始する

---

**REQ-063**
- 種別: EARS-イベント駆動
- 優先度: SHOULD
- 要件文: When the player clicks "DELETE SAVE" in the settings menu, the system shall remove "mario_save" from localStorage and display "SAVE DELETED" for 2 seconds.
- 受入テスト(GWT):
  - Given: セーブデータが存在する
  - When: "DELETE SAVE" ボタンをクリックする
  - Then: localStorage["mario_save"] が削除され、"SAVE DELETED" メッセージが 2 秒間表示される
- 例外・エラー: なし

---

## 10. 非機能要件（REQ-900〜920）

---

**REQ-900**
- 種別: EARS-普遍
- 優先度: MUST
- カテゴリ: パフォーマンス
- 要件文: The system shall maintain a minimum frame rate of 60fps on a device with Intel Core i5-8250U CPU and 8GB RAM running Chrome 120+.
- 受入テスト(GWT):
  - Given: Core i5-8250U 端末で Chrome 120 を使用
  - When: ゲームプレイ中（敵 10 体・コイン 30 枚が画面内に存在）
  - Then: Chrome DevTools Performance タブで 60fps が 95% 以上維持されている

---

**REQ-901**
- 種別: EARS-普遍
- 優先度: MUST
- カテゴリ: パフォーマンス
- 要件文: The system shall complete the initial page load and display the title screen within 5 seconds on a 50Mbps connection.
- 受入テスト(GWT):
  - Given: 50Mbps 回線
  - When: URL を開く
  - Then: Chrome DevTools の Load イベントから 5 秒以内にタイトル画面が表示される

---

**REQ-902**
- 種別: EARS-普遍
- 優先度: MUST
- カテゴリ: パフォーマンス
- 要件文: The system shall keep the total bundle size (JS + assets) below 10MB to minimize initial download time.
- 受入テスト(GWT):
  - Given: vite build が実行された
  - When: dist ディレクトリのサイズを確認する
  - Then: 全ファイルの合計サイズが 10MB 以下である
- 例外・エラー: なし

---

**REQ-903**
- 種別: EARS-普遍
- 優先度: MUST
- カテゴリ: ブラウザ互換性
- 要件文: The system shall function without errors on Chrome 120+, Firefox 120+, and Safari 17+ on macOS and Windows.
- 受入テスト(GWT):
  - Given: 各ブラウザ（Chrome 120, Firefox 120, Safari 17）でゲームを開く
  - When: ステージ 1-1 を最初から最後まで実行する
  - Then: JavaScript エラーが発生せず、ゲームが正常に完走する

---

**REQ-904**
- 種別: EARS-普遍
- 優先度: MUST
- カテゴリ: コード品質
- 要件文: The system shall pass TypeScript strict mode compilation with 0 type errors.
- 受入テスト(GWT):
  - Given: tsconfig.json に "strict": true が設定されている
  - When: npx tsc --noEmit を実行する
  - Then: エラー出力が 0 件である

---

**REQ-905**
- 種別: EARS-普遍
- 優先度: MUST
- カテゴリ: コード品質
- 要件文: The system shall achieve a minimum of 80% line coverage measured by Vitest coverage.
- 受入テスト(GWT):
  - Given: Vitest がセットアップされている
  - When: npx vitest run --coverage を実行する
  - Then: coverage レポートの lines パーセンテージが 80% 以上である

---

**REQ-906**
- 種別: EARS-普遍
- 優先度: MUST
- カテゴリ: コード品質
- 要件文: The system shall pass ESLint with 0 errors using the project's .eslintrc configuration.
- 受入テスト(GWT):
  - Given: .eslintrc が設定されている
  - When: npx eslint src/ を実行する
  - Then: error レベルの出力が 0 件である

---

**REQ-907**
- 種別: EARS-普遍
- 優先度: MUST
- カテゴリ: ビルド
- 要件文: The system shall produce a production build via `npm run build` that completes without errors within 60 seconds.
- 受入テスト(GWT):
  - Given: npm dependencies がインストールされている
  - When: npm run build を実行する
  - Then: 60 秒以内にビルドが完了し、dist ディレクトリに出力される

---

**REQ-908**
- 種別: EARS-普遍
- 優先度: MUST
- カテゴリ: デプロイ
- 要件文: The system shall be deployable to GitHub Pages by pushing to the main branch via a GitHub Actions workflow.
- 受入テスト(GWT):
  - Given: GitHub Actions ワークフローが設定されている
  - When: main ブランチへ push する
  - Then: GitHub Actions ジョブが成功し、GitHub Pages に最新ビルドがデプロイされる

---

**REQ-909**
- 種別: EARS-普遍
- 優先度: MUST
- カテゴリ: 可用性
- 要件文: The system shall be accessible via HTTPS at the deployed URL with an HTTP 200 response code within 3 seconds.
- 受入テスト(GWT):
  - Given: ゲームが GitHub Pages にデプロイされている
  - When: curl -o /dev/null -s -w "%{http_code}" https://{url}/index.html を実行する
  - Then: HTTP レスポンスコード 200 が 3 秒以内に返る

---

**REQ-910**
- 種別: EARS-普遍
- 優先度: MUST
- カテゴリ: 保守性
- 要件文: The system shall keep each TypeScript source file within 400 lines.
- 受入テスト(GWT):
  - Given: src/ ディレクトリ内の全 .ts ファイル
  - When: 行数を計測する（wc -l）
  - Then: 全ファイルが 400 行以下である

---

**REQ-911**
- 種別: EARS-普遍
- 優先度: SHOULD
- カテゴリ: パフォーマンス
- 要件文: The system shall keep GPU memory usage below 256MB when running on an integrated GPU (Intel UHD Graphics 620).
- 受入テスト(GWT):
  - Given: Intel UHD 620 搭載端末
  - When: Chrome DevTools > Memory タブで計測する
  - Then: GPU メモリ使用量が 256MB 以下である

---

**REQ-912**
- 種別: EARS-普遍
- 優先度: SHOULD
- カテゴリ: パフォーマンス
- 要件文: The system shall implement object pooling for projectiles and particles, maintaining a pool size of at least 50 objects.
- 受入テスト(GWT):
  - Given: ファイアボールを 10 回連続発射する
  - When: メモリプロファイルを取得する
  - Then: 新規 GameObjects の生成数が 0（プールから再利用）である

---

**REQ-913**
- 種別: EARS-普遍
- 優先度: SHOULD
- カテゴリ: アクセシビリティ
- 要件文: The system shall provide keyboard focus indicators visible on all interactive UI elements with a minimum contrast ratio of 3:1.
- 受入テスト(GWT):
  - Given: キーボードのみで操作している
  - When: Tab キーでフォーカスを移動する
  - Then: フォーカス中の要素に 3:1 以上のコントラスト比のアウトラインが表示される

---

**REQ-914**
- 種別: EARS-普遍
- 優先度: SHOULD
- カテゴリ: 国際化
- 要件文: The system shall support switching the display language between Japanese and English via a settings option.
- 受入テスト(GWT):
  - Given: 設定メニューが開いている
  - When: "English" を選択する
  - Then: UI テキスト（タイトル・HUD・メニュー）が英語に切り替わる

---

**REQ-915**
- 種別: EARS-普遍
- 優先度: SHOULD
- カテゴリ: テスト
- 要件文: The system shall include unit tests for all game logic functions (physics calculation, score calculation, enemy AI state machine) with a coverage of 80% or above.
- 受入テスト(GWT):
  - Given: Vitest が設定されている
  - When: npx vitest run を実行する
  - Then: physics / score / enemy AI モジュールのカバレッジが 80% 以上である

---

**REQ-916**
- 種別: EARS-普遍
- 優先度: SHOULD
- カテゴリ: CI
- 要件文: The system shall execute the test suite and ESLint checks automatically on every pull request via GitHub Actions, failing the check if any test fails.
- 受入テスト(GWT):
  - Given: GitHub Actions CI ワークフローが設定されている
  - When: プルリクエストが作成される
  - Then: テストと ESLint が自動実行され、1 件でも失敗した場合はチェックがブロックされる

---

**REQ-917**
- 種別: EARS-普遍
- 優先度: SHOULD
- カテゴリ: 保守性
- 要件文: The system shall define all game constants (player speed, gravity, jump impulse, etc.) in a single constants.ts file with no hardcoded values in scene files.
- 受入テスト(GWT):
  - Given: src/config/constants.ts が存在する
  - When: src/scenes/ ディレクトリ内のファイルを grep で検索する
  - Then: マジックナンバー（200, 600, 980 等）がシーンファイルに直接記述されていない

---

**REQ-918**
- 種別: EARS-普遍
- 優先度: COULD
- カテゴリ: パフォーマンス
- 要件文: The system shall lazy-load stage assets (tilemap, sprites) only when transitioning to that stage, reducing initial bundle payload.
- 受入テスト(GWT):
  - Given: ゲームを開く
  - When: Chrome DevTools Network タブでリソース読み込みを観察する
  - Then: ステージ 1-2 のアセットはステージ 1-1 クリア後に初めてダウンロードされる

---

**REQ-919**
- 種別: EARS-普遍
- 優先度: COULD
- カテゴリ: 保守性
- 要件文: The system shall document all public TypeScript interfaces and classes with JSDoc comments covering purpose, parameters, and return values.
- 受入テスト(GWT):
  - Given: src/ ディレクトリ内の全 .ts ファイル
  - When: TypeDoc を実行する
  - Then: 全パブリックインターフェースおよびクラスに JSDoc コメントが付与されている

---

**REQ-920**
- 種別: EARS-普遍
- 優先度: COULD
- カテゴリ: デプロイ
- 要件文: The system shall support deployment to Vercel as an alternative to GitHub Pages by providing a vercel.json configuration file.
- 受入テスト(GWT):
  - Given: vercel.json が存在する
  - When: vercel deploy を実行する
  - Then: Vercel にデプロイが成功し、URL が発行される

---

## 11. セキュリティ要件（REQ-SEC-001〜010）

---

**REQ-SEC-001**
- 種別: EARS-普遍
- 優先度: MUST
- 要件文: The system shall not include any API keys, authentication tokens, or credentials in the frontend JavaScript bundle.
- 受入テスト(GWT):
  - Given: vite build で dist/ が生成された
  - When: dist/ 内の JS ファイルを grep で "key", "token", "secret" で検索する
  - Then: 一致する文字列が 0 件である

---

**REQ-SEC-002**
- 種別: EARS-普遍
- 優先度: MUST
- 要件文: The system shall validate all localStorage read data against an expected schema before use, discarding data that fails validation.
- 受入テスト(GWT):
  - Given: localStorage["mario_save"] に不正な JSON（"{score: null, lives: -1}"）が設定されている
  - When: ゲームを起動してコンティニューを試みる
  - Then: 不正データは破棄され、ステージ 1-1 から新規ゲームとして開始される

---

**REQ-SEC-003**
- 種別: EARS-普遍
- 優先度: MUST
- 要件文: The system shall set the Content-Security-Policy header to allow only same-origin scripts and inline styles generated by Vite.
- 受入テスト(GWT):
  - Given: GitHub Pages または Vercel にデプロイされた状態
  - When: ブラウザの DevTools > Network タブで index.html のレスポンスヘッダーを確認する
  - Then: Content-Security-Policy ヘッダーが存在し、外部スクリプトを許可していない
- 例外・エラー: If ホスティング側が CSP ヘッダー設定をサポートしていない場合, then meta タグで代替する

---

**REQ-SEC-004**
- 種別: EARS-普遍
- 優先度: MUST
- 要件文: The system shall not execute any dynamically evaluated code (eval, Function constructor, innerHTML with untrusted content).
- 受入テスト(GWT):
  - Given: ソースコード全体
  - When: ESLint の no-eval ルールを実行する
  - Then: eval() および new Function() の使用箇所が 0 件である

---

**REQ-SEC-005**
- 種別: EARS-普遍
- 優先度: MUST
- 要件文: The system shall sanitize any user-provided text input before rendering it to the DOM to prevent Cross-Site Scripting.
- 受入テスト(GWT):
  - Given: プレイヤー名入力フォーム（将来追加時を含む）
  - When: "<script>alert('xss')</script>" を入力して送信する
  - Then: スクリプトが実行されず、テキストとしてエスケープ表示される

---

**REQ-SEC-006**
- 種別: EARS-普遍
- 優先度: SHOULD
- 要件文: The system shall set Referrer-Policy to "strict-origin-when-cross-origin" on the hosting configuration.
- 受入テスト(GWT):
  - Given: デプロイ済み環境
  - When: curl -I https://{url}/index.html を実行する
  - Then: Referrer-Policy: strict-origin-when-cross-origin ヘッダーが存在する

---

**REQ-SEC-007**
- 種別: EARS-普遍
- 優先度: SHOULD
- 要件文: The system shall set X-Content-Type-Options header to "nosniff" on all served files.
- 受入テスト(GWT):
  - Given: デプロイ済み環境
  - When: curl -I https://{url}/index.js を実行する
  - Then: X-Content-Type-Options: nosniff ヘッダーが存在する

---

**REQ-SEC-008**
- 種別: EARS-普遍
- 優先度: SHOULD
- 要件文: The system shall run npm audit with 0 high or critical severity vulnerabilities before each production deployment.
- 受入テスト(GWT):
  - Given: package.json の依存関係が最新化されている
  - When: npm audit --audit-level=high を実行する
  - Then: high または critical の脆弱性が 0 件と報告される

---

**REQ-SEC-009**
- 種別: EARS-普遍
- 優先度: SHOULD
- 要件文: The system shall implement subresource integrity (SRI) checks for any external CDN resources loaded in index.html.
- 受入テスト(GWT):
  - Given: index.html に外部 CDN からのリソースが含まれる場合
  - When: index.html の script/link タグを確認する
  - Then: 全外部リソースに integrity 属性および crossorigin="anonymous" が付与されている
- 例外・エラー: If 外部 CDN リソースが 0 件の場合（全バンドル内包）, then この要件は N/A

---

**REQ-SEC-010**
- 種別: EARS-普遍
- 優先度: SHOULD
- 要件文: The system shall limit localStorage usage to the keys "mario_highscore" and "mario_save" only, and not store any personally identifiable information.
- 受入テスト(GWT):
  - Given: ゲームをプレイしてセーブした
  - When: ブラウザの DevTools > Application > localStorage を確認する
  - Then: 存在するキーが "mario_highscore" と "mario_save" のみであり、メールアドレスや IP アドレスは含まれていない

---

## 12. 運用要件（REQ-OPS-001〜007）

---

**REQ-OPS-001**
- 種別: EARS-普遍
- 優先度: MUST
- 要件文: The system shall be hosted on GitHub Pages or Vercel at zero monthly cost for Phase 1.
- 受入テスト(GWT):
  - Given: ゲームがデプロイされている
  - When: 請求レポートを確認する
  - Then: 月額費用が $0 である
- 例外・エラー: なし

---

**REQ-OPS-002**
- 種別: EARS-普遍
- 優先度: MUST
- 要件文: The system shall serve all static assets with Cache-Control: public, max-age=31536000, immutable for versioned files.
- 受入テスト(GWT):
  - Given: デプロイ済み環境
  - When: curl -I https://{url}/assets/index-{hash}.js を実行する
  - Then: Cache-Control: public, max-age=31536000 ヘッダーが存在する

---

**REQ-OPS-003**
- 種別: EARS-普遍
- 優先度: MUST
- 要件文: The system shall include a GitHub Actions CI/CD workflow that automatically builds and deploys to GitHub Pages on every push to the main branch.
- 受入テスト(GWT):
  - Given: .github/workflows/deploy.yml が存在する
  - When: main ブランチへ push する
  - Then: GitHub Actions ジョブが起動し、ビルド・デプロイが自動実行される

---

**REQ-OPS-004**
- 種別: EARS-普遍
- 優先度: SHOULD
- 要件文: The system shall maintain a CHANGELOG.md file updated with each release following the Keep a Changelog format.
- 受入テスト(GWT):
  - Given: 新しいリリースタグが打たれた
  - When: CHANGELOG.md を確認する
  - Then: 最新バージョンのエントリが Added / Changed / Fixed セクションで記述されている

---

**REQ-OPS-005**
- 種別: EARS-普遍
- 優先度: SHOULD
- 要件文: The system shall tag each production release with a semantic version number (MAJOR.MINOR.PATCH) in the git repository.
- 受入テスト(GWT):
  - Given: デプロイ前
  - When: git tag を確認する
  - Then: v1.0.0 形式のタグが存在する

---

**REQ-OPS-006**
- 種別: EARS-普遍
- 優先度: SHOULD
- 要件文: The system shall log JavaScript runtime errors to the browser console with structured format including timestamp, error type, and stack trace.
- 受入テスト(GWT):
  - Given: ゲーム実行中に意図的な例外を発生させる
  - When: ブラウザコンソールを確認する
  - Then: "{"timestamp":"...","type":"...","stack":"..."}" 形式のエラーログが出力されている

---

**REQ-OPS-007**
- 種別: EARS-普遍
- 優先度: SHOULD
- 要件文: The system shall provide a health check endpoint or meta tag containing the current deployed version number readable from the browser.
- 受入テスト(GWT):
  - Given: ゲームがデプロイされている
  - When: index.html の meta タグを確認する
  - Then: `<meta name="app-version" content="1.0.0">` が存在する

## 13. セキュリティ要件（REQ-SEC参照）

> 詳細な脅威分析と緩和策は `threat-model.md` を参照。
> ガードレール定義は `guardrails.md` を参照。

### REQ-SEC-001: Same-Origin Policy 強制
- 優先度: MUST
- 要件文(EARS): The system shall enforce Same-Origin Policy for all localStorage access.
- 対応脅威: T-01（Spoofing）

### REQ-SEC-002: セーブデータスキーマ検証
- 優先度: MUST
- 要件文(EARS): When loading save data from localStorage, the system shall validate the data against the SaveData Zod schema and reject data that does not conform.
- 対応脅威: T-02, T-03（Tampering）

### REQ-SEC-003: セーブデータ整合性チェック
- 優先度: MUST
- 要件文(EARS): The system shall compute and verify an HMAC-SHA256 checksum for all saved game data.
- 対応脅威: T-03（Tampering）

### REQ-SEC-004: ゲーム状態カプセル化
- 優先度: MUST
- 要件文(EARS): The system shall encapsulate all mutable game state within the GameState object and prevent direct access from the browser console.
- 対応脅威: T-04（Tampering）

### REQ-SEC-005: レベルデータ入力検証
- 優先度: MUST
- 要件文(EARS): When loading Tiled JSON level data, the system shall validate tile IDs, layer dimensions, and object attributes against an allowlist schema.
- 対応脅威: T-05, T-14, T-15（Tampering / Elevation of Privilege）

---

## 14. 未解決事項（Open Questions）

現時点で未解決の事項はありません。全要件は TAISUN v2 リサーチレポート（`research/runs/2026-03-20__mario-game-proposal/report.md`）および Pass 2 ギャップ補完リサーチの結果に基づいて定義されています。

今後追加検討が必要な事項:
- Phaser 4 正式リリース後の移行タイミング（RC4 段階のため時期未確定）
- Poki プラットフォームでの日本語ゲームの実収益水準（非公開データ）
- AI 生成アセットに関する 2026 年以降の法改正見通し
