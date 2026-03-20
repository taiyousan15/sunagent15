# Agent B — API・ライブラリ・SaaS 調査レポート
**BUILD_TARGET**: マリオ風2Dプラットフォーマーゲーム（ブラウザ/Web版）
**調査日**: 2026-03-20
**調査者**: Agent B（API・ライブラリ・SaaS専門）

---

## 1. ゲームエンジン

### Phaser 3 / Phaser 4
| 項目 | Phaser 3 | Phaser 4 (beta) |
|------|----------|-----------------|
| 最新バージョン | 3.88.x | 4.0.0-beta |
| ライセンス | MIT | MIT |
| 状態 | 安定・本番推奨 | 評価段階（移行中） |
| 内部API互換 | - | Phaser 3と概ね互換 |
| レンダラ | WebGL/Canvas | Beam（新設計） |
| CVE/脆弱性 | 主要なCVEなし（phaser-CE は別途要確認） | N/A |
| コスト | 無料 | 無料 |

**マリオゲームでの用途**: シーン管理・スプライト・アニメーション・物理エンジン統合・カメラ追跡
**推奨**: 現時点ではPhaser 3（安定版）を採用し、Phaser 4 APIに追従できる構造を維持する。

出典: [Phaser 4 is coming - Gamedev.js](https://gamedevjs.com/tools/phaser-4-is-coming/) / [Migrating Shaders to Phaser 4](https://phaser.io/news/2025/11/migrating-phaser-3-shaders-to-phaser-4)

---

## 2. サウンド

### howler.js
| 項目 | 詳細 |
|------|------|
| バージョン | 2.2.x |
| ライセンス | MIT |
| npm | `howler` |
| バンドルサイズ | 7KB (gzip) |
| 依存関係 | ゼロ |
| CVE | 報告なし |
| コスト | 無料 |

**特徴**: Web Audio API優先、HTML5 Audio へのフォールバックあり。MP3/OGG/WAV/OPUS 等全フォーマット対応。オーディオスプライト対応（BGM・SE効率化）。3Dサウンド（howler.spatial）も含む。
**マリオゲームでの用途**: BGM ループ再生・ジャンプ音・コイン取得音・SE スプライト管理

出典: [howler.js 公式](https://howlerjs.com/) / [npm: howler](https://www.npmjs.com/package/howler)

---

## 3. タイルマップ

### Tiled Map Editor + phaser-tilemaps
| 項目 | 詳細 |
|------|------|
| Tiled バージョン | 1.11.x / 1.12.x |
| ライセンス | GPL 2.0（エディタ）／独自（エクスポートデータ） |
| フォーマット | TMX（XML）/ JSON |
| Phaser 統合 | Phaser 3 built-in（`this.make.tilemap()`） |
| CVE | なし |
| コスト | 無料（Tiled 本体）|

**JSローダー選択肢**:
- Phaser 3 built-in tilemap loader: **最優先**（追加パッケージ不要）
- pixi-tiledmap: Pixi.js 用（今回は不要）
- tmx-map-parser: 汎用パーサ（単体使用時）
- excalibur-tiled: Excalibur エンジン用

**マリオゲームでの用途**: ステージレイアウト・地形コリジョン・背景レイヤー・敵配置データ

出典: [TMX Map Format - Tiled Docs](https://doc.mapeditor.org/en/stable/reference/tmx-map-format/) / [Libraries and Frameworks](https://doc.mapeditor.org/en/stable/reference/support-for-tmx-maps/)

---

## 4. 物理エンジン

### Matter.js vs Planck.js 比較
| 項目 | Matter.js | Planck.js |
|------|-----------|-----------|
| ライセンス | MIT | MIT |
| GitHub Stars | ~15k+ | ~4.9k |
| ベース | 独自実装 | Box2D（JSリライト）|
| 精度 | 高（ゲーム品質） | 最高（Box2D互換）|
| ドキュメント | 豊富 | 中程度 |
| Phaser 統合 | built-in（MatterJS） | 外部連携必要 |
| CVE | なし | なし |
| コスト | 無料 | 無料 |

**推奨**: Phaser 3 の built-in Matter.js 統合を採用（`physics: { default: 'matter' }`）
**マリオゲームでの用途**: 重力・衝突判定・プラットフォーム立ち位置・ジャンプ物理

出典: [Matter.js 公式](https://brm.io/matter-js/) / [Planck.js 公式](https://piqnt.com/planck.js/) / [Top 9 2D Physics Engines - daily.dev](https://daily.dev/blog/top-9-open-source-2d-physics-engines-compared)

---

## 5. ビルドツール / スターターテンプレート

### Vite + Phaser 3 + TypeScript 公式テンプレート
| 項目 | 詳細 |
|------|------|
| リポジトリ | [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts) |
| Phaser | 3.70.0+ |
| Vite | 5.x |
| TypeScript | 5.x |
| ホットリロード | 対応 |
| ライセンス | MIT |
| コスト | 無料 |

**Phaser 4 用テンプレート**: [phaserjs/editor-starter-template-phaser4-vite](https://github.com/phaserjs/editor-starter-template-phaser4-vite)（beta向け）

**マリオゲームでの用途**: 高速開発サーバ・型安全コーディング・本番ビルド最適化

出典: [Phaser + TypeScript + Vite Template](https://phaser.io/news/2024/01/phaser-vite-typescript-template)

---

## 6. ゲームパッド対応

### Web Gamepad API（ブラウザ標準）
| 項目 | 詳細 |
|------|------|
| 仕様 | W3C Working Draft |
| ブラウザカバレッジ | 約63%（caniuse.com） |
| ポーリング方式 | requestAnimationFrame 内で 60fps ポーリング |
| 対応コントローラ | Xbox / PS3 / PS4 / PS5 |
| ライブラリ | [gamecontroller.js](https://github.com/alvaromontoro/gamecontroller.js) |
| コスト | 無料（ブラウザ標準API）|

**Phaser 3 統合**: `this.input.gamepad` で内蔵対応済み
**マリオゲームでの用途**: 十字キー移動・ジャンプボタン・ポーズ操作

出典: [MDN: Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API) / [HTML5 Gamepad API 2026 Guide](https://gamepadtester.pro/the-html5-gamepad-api-a-developers-guide-to-browser-controllers/)

---

## 7. セキュリティ・脆弱性評価

### npm パッケージ セキュリティ状態（2026-03-20 時点）
| パッケージ | CVE | Snyk状態 | リスク |
|-----------|-----|---------|-------|
| phaser | 報告なし（主要CVEなし）| phaser-ce は別途確認 | 低 |
| howler | 報告なし | クリーン | 低 |
| matter-js | 報告なし | クリーン | 低 |
| vite | 定期パッチあり（follow推奨）| 要最新バージョン維持 | 中（要監視） |

**注意**: phaser-ce（Community Edition）は phaser 本体と別パッケージ。Snyk で個別確認推奨。
**推奨**: `npm audit` を CI に組み込み、依存関係を定期スキャンする。

出典: [Snyk: phaser-ce vulnerabilities](https://security.snyk.io/package/npm/phaser-ce) / [npm Security Risks 2026](https://blog.cyberdesserts.com/npm-security-vulnerabilities/)

---

## 8. マネタイズ

### itch.io（HTML5ゲーム公開）
| 項目 | 詳細 |
|------|------|
| 公開コスト | 無料（出版費ゼロ）|
| 収益分配 | 開発者が割合を設定（itch.io への分配は任意）|
| 対応フォーマット | HTML5（ZIP でアップロード、index.html がルートに必要）|
| 価格帯推奨 | 無料〜$15（投げ銭対応）|
| 無料ゲームの投げ銭率 | DL数の1〜3% |
| Web Monetization | 対応（Interledger Protocol 連携）|

**マリオゲームでの用途**: プロトタイプの無料公開・有料ダウンロード販売・ゲームジャム参加

出典: [itch.io Developers](https://itch.io/developers) / [How to Make Money on Itch.io 2026](https://generalistprogrammer.com/tutorials/how-to-make-money-on-itchio-indie-game-guide) / [Uploading HTML5 games](https://itch.io/docs/creators/html5)

---

## 9. PWA / オフライン対応

### Service Worker + Workbox 7
| 項目 | 詳細 |
|------|------|
| Workbox バージョン | 7.x（2026 現在）|
| Vite 統合 | `vite-plugin-pwa` 経由でネイティブ統合 |
| キャッシュ戦略 | 静的アセット: Cache-First / 動的データ: Network-First |
| ゲームアセット | Cache-First で画像・音声・スプライトシートをオフライン化 |
| デバッグ | Chrome DevTools Application パネルで完全対応 |
| コスト | 無料 |

**マリオゲームでの用途**: アセット事前キャッシュによるオフラインプレイ対応・インストール可能なゲームアプリ化

出典: [Progressive Web Apps 2026](https://www.digitalapplied.com/blog/progressive-web-apps-2026-pwa-performance-guide) / [MDN: PWA Caching](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching)

---

## 推奨スタック サマリー

| カテゴリ | 採用候補 | 理由 |
|---------|---------|------|
| ゲームエンジン | Phaser 3.88.x | 安定・豊富なエコシステム・Phaser 4 移行パス |
| ビルドツール | Vite 5 + TypeScript 5 | 公式テンプレートあり・HMR高速 |
| サウンド | howler.js 2.2.x | 軽量・全フォーマット対応・依存ゼロ |
| タイルマップ | Tiled 1.11 + Phaser built-in loader | 追加パッケージ不要 |
| 物理エンジン | Matter.js（Phaser built-in） | Phaser 統合済み・学習コスト低 |
| ゲームパッド | Phaser built-in Gamepad API | 追加パッケージ不要 |
| 公開プラットフォーム | itch.io | 無料公開・収益化両立 |
| PWA | Workbox 7 + vite-plugin-pwa | Vite ネイティブ統合 |

**総合セキュリティリスク**: 低（主要パッケージに既知CVEなし。CI に `npm audit` 組み込みを推奨）
