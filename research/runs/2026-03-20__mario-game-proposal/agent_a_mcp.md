# Agent A — MCP・スキル・拡張機能発掘レポート

**BUILD_TARGET**: マリオ風2Dプラットフォーマーゲーム（ブラウザ/Web版）
**調査日**: 2026-03-20
**担当エージェント**: Agent A (MCP・ツール発掘専門)

---

## 問いの再定義

- **主問**: ブラウザ動作のマリオ風2Dプラットフォーマーを最速で構築するには何を使うべきか？
- **副問1**: Claude Code と連携できるゲーム開発向け MCP サーバーは存在するか？
- **副問2**: 2026年現在で最もコミュニティが活発なJS/TSゲームエンジンはどれか？
- **副問3**: 無料で利用可能なマリオ風アセット（スプライト）はどこで入手できるか？

---

## TOP 10 ツール一覧

| # | 名前 | Stars | npm DL/月 | ライセンス | マリオ適用度 |
|---|------|-------|-----------|-----------|------------|
| 1 | Phaser 3 | 38,700 | ~200,000 | MIT | ★★★ |
| 2 | KAPLAY (Kaboom後継) | ~5,000 | ~30,000 | MIT | ★★★ |
| 3 | Excalibur.js | ~5,500 | ~15,000 | BSD-2 | ★★★ |
| 4 | melonJS | ~5,800 | ~8,000 | MIT | ★★★ |
| 5 | LittleJS | ~3,600 | ~5,000 | MIT | ★★ |
| 6 | PixiJS | ~43,000 | ~500,000 | MIT | ★★ |
| 7 | Babylon.js | ~25,000 | ~300,000 | Apache-2.0 | ★ |
| 8 | PlayCanvas Engine | ~9,500 | ~20,000 | MIT | ★ |
| 9 | Godot MCP (Claude連携) | N/A | N/A | MIT | ★★ |
| 10 | Roblox Studio MCP | N/A | N/A | Proprietary | ★ |

> Stars・DL数は2025年末〜2026年初頭の調査値。目安として参照。

---

## 各ツール詳細

### 1. Phaser 3 — ★★★ 最推奨
**概要**: HTML5 2Dゲームの事実上の標準フレームワーク。Canvas/WebGL両対応。

- **GitHub**: https://github.com/phaserjs/phaser (38.7k stars)
- **npm**: https://www.npmjs.com/package/phaser
- **最新版**: v3.90.0 "Tsugumi"
- **install**:
  ```bash
  npm install phaser
  ```
- **マリオ適用理由**: Arcade Physics (重力・衝突判定)、Tilemapサポート、スプライトアニメーション、カメラ追従、Scene管理がすべて組み込み。マリオ風ゲームのチュートリアルが公式・非公式に豊富。

---

### 2. KAPLAY.js (Kaboom.js 後継) — ★★★ 推奨
**概要**: Kaboom.js が Replit に放棄された後、コミュニティが 2024/5/21 にフォーク・継続開発。Kaboom との完全互換性を維持。

- **GitHub**: https://github.com/kaplayjs/kaplay
- **公式**: https://kaplayjs.com/
- **install**:
  ```bash
  npm install kaplay
  ```
- **マリオ適用理由**: ECS アーキテクチャ、ASCII マップによるレベル設計、アーケード物理、TypeScript サポート。シンプルな API で素早くプロトタイプ作成可能。

---

### 3. Excalibur.js — ★★★ 推奨
**概要**: TypeScript ネイティブの "batteries included" 2D ゲームエンジン。

- **GitHub**: https://github.com/excaliburjs/Excalibur (5.5k stars)
- **公式**: https://excaliburjs.com/docs/
- **ライセンス**: BSD-2-Clause
- **install**:
  ```bash
  npm install excalibur
  ```
- **マリオ適用理由**: TypeScript ファースト設計、衝突システム、タイル/スプライトシート対応、シーン管理。型安全なゲーム開発に最適。

---

### 4. melonJS — ★★★ 推奨
**概要**: 依存ゼロ・完全 tree-shakeable な軽量 HTML5 ゲームエンジン。WebGL + Canvas フォールバック。

- **GitHub**: https://github.com/melonjs/melonJS (5.8k stars)
- **公式**: https://melonjs.org/
- **install**:
  ```bash
  npm install melonjs
  ```
- **マリオ適用理由**: Tiled マップエディタとの直接統合、プラットフォーマー向けの慣性・重力物理が充実。

---

### 5. LittleJS — ★★ 検討
**概要**: 依存ゼロ・超軽量の HTML5 ゲームエンジン。ファイルサイズ最小クラス。

- **GitHub**: https://github.com/KilledByAPixel/LittleJS (3.6k stars)
- **install**:
  ```bash
  npm install littlejsengine
  ```
- **マリオ適用理由**: パーティクル、サウンド、入力管理を内包。ゲームジャム用途や軽量デモに最適。フル機能ゲームには物足りない場合あり。

---

### 6. PixiJS — ★★ レンダラとして活用
**概要**: 高性能 WebGL 2D レンダリングライブラリ。ゲームエンジンではなくレンダラ特化。

- **GitHub**: https://github.com/pixijs/pixijs (43k stars)
- **npm DL**: 月約 50 万（最大規模）
- **install**:
  ```bash
  npm install pixi.js
  ```
- **マリオ適用理由**: レンダリング性能は最高クラス。ただしゲームループ・物理は自前実装が必要。Phaser のバックエンドとしても利用可能。

---

### 7. Babylon.js — ★ 3D向け
**概要**: 3D/WebGPU 主体。2D プラットフォーマーには過剰。

- **Stars**: 25,000 / **ライセンス**: Apache-2.0
- **install**: `npm install babylonjs`
- **マリオ適用理由**: 2D ゲームへの適用度は低い。3D マリオ（スーパーマリオ64風）なら候補になりうる。

---

### 8. PlayCanvas Engine — ★ WebGL 3D向け
**概要**: WebGL ゲームエンジン。3D コンテンツ向け。

- **Stars**: 9,500 / **ライセンス**: MIT
- **install**: `npm install playcanvas`
- **マリオ適用理由**: 2D には不向き。

---

### 9. Godot MCP (Claude Code 連携) — ★★ 開発補助
**概要**: Claude Code から Godot プロジェクトをリモート制御できる MCP サーバー。シーン管理・デバッグ・スクリーンショット取得など 95+ ツール対応。

- **出典**: Roblox Studio MCP 記事 / Bannerbear MCP ガイド
- **対象**: Godot 4.x + Node.js 18+
- **install**: ソースビルド（Rust）
- **マリオ適用理由**: Claude Code でゲームロジックを AI 補助しながら開発。Godot の 2D エンジンは高品質。ただし Web 出力には追加設定が必要。

---

### 10. Roblox Studio MCP — ★ 参考
**概要**: Roblox Studio を Claude Code / Cursor から操作する MCP サーバー。

- **出典**: https://lobehub.com/mcp/zubeidhendricks-roblox-studio-mcp-claude-code
- **マリオ適用理由**: Roblox 限定。ブラウザ汎用ゲームには不適。

---

## 無料アセット情報

### itch.io（マリオ風スプライト）
- **URL**: https://itch.io/game-assets/free/genre-platformer
- **注目パック**:
  - Brackeys' Platformer Bundle（MIT）
  - Pixel Adventure シリーズ（16x16/32x32）
  - Free - Pixel Art Asset Pack - Sidescroller Fantasy
  - Free Tiny Hero Sprites Pixel Art

### OpenGameArt.org
- **URL**: https://opengameart.org/
- **注目**: Platformer Sprites パック、Farm theme platformer
- **ライセンス**: CC0/CC-BY が多数

---

## MCP サーバー状況サマリー

2026年3月時点で、**ゲーム開発専用の汎用 MCP サーバーは限定的**。現時点での主な選択肢:

| MCP サーバー | 対象エンジン | Claude Code 対応 | 備考 |
|-------------|------------|-----------------|------|
| Godot MCP | Godot 4.x | ○ | 最も充実 (95+ tools) |
| Roblox Studio MCP | Roblox Studio | ○ | Roblox 限定 |
| GitHub MCP | 全般 | ○ | コード管理補助 |
| Playwright MCP | ブラウザテスト | ○ | ゲーム動作テストに活用可 |

Phaser / KAPLAY 専用の MCP は2026年3月時点では未確認。Claude Code との統合は GitHub MCP + Playwright MCP の組み合わせが現実的。

---

## 結論

**推奨構成**: Phaser 3 (メインエンジン) + itch.io 無料アセット + GitHub MCP + Playwright MCP

- **理由**: Stars 38.7k・npm DL 最大・マリオ向けチュートリアル豊富・Arcade Physics 内蔵
- **次点**: TypeScript 重視なら Excalibur.js、シンプルさ優先なら KAPLAY

---

## 重要ポイント

1. Kaboom.js は廃止済み → KAPLAY へ移行必須
2. ゲーム専用 MCP は Godot 向けのみ充実（Phaser 向けは未整備）
3. 無料アセットは itch.io + OpenGameArt の組み合わせで十分調達可能
4. PixiJS は DL 数最大だがゲームエンジンではなくレンダラ（物理エンジン別途必要）

---

## 未解決 / 追加調査項目

- [ ] Phaser 3 の npm 週間 DL 数の最新値（npmjs.com で要確認）
- [ ] KAPLAY の Stars 数最新値（GitHub で要確認）
- [ ] Phaser 専用の Claude Code MCP サーバーが開発中かどうか
- [ ] itch.io アセットの具体的ライセンス（CC0 / CC-BY / カスタム）確認

---

## 出典

- [Bannerbear: 8 Best MCP Servers for Claude Code Developers in 2026](https://www.bannerbear.com/blog/8-best-mcp-servers-for-claude-code-developers-in-2026/)
- [Roblox Studio MCP for Claude Code - LobeHub](https://lobehub.com/mcp/zubeidhendricks-roblox-studio-mcp-claude-code)
- [phaserjs/phaser - GitHub](https://github.com/phaserjs/phaser)
- [phaser - npm](https://www.npmjs.com/package/phaser)
- [KAPLAY.js 公式](https://kaplayjs.com/)
- [JSLegendDev: Kaboom.js is now Kaplay](https://jslegenddev.substack.com/p/kaboomjs-is-now-kaplay)
- [excaliburjs/Excalibur - GitHub](https://github.com/excaliburjs/Excalibur)
- [melonJS 公式](https://melonjs.org/)
- [KilledByAPixel/LittleJS - GitHub](https://github.com/KilledByAPixel/LittleJS)
- [GameFromScratch: JS/TS Game Engines in 2025](https://gamefromscratch.com/javascript-typescript-game-engines-in-2025/)
- [itch.io: Free Platformer Assets](https://itch.io/game-assets/free/genre-platformer)
- [OpenGameArt.org](https://opengameart.org/)
- [js-game-rendering-benchmark - GitHub](https://github.com/Shirajuki/js-game-rendering-benchmark)
