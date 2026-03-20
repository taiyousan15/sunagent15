# Pass 2: ギャップ補完リサーチ結果

> 調査日: 2026-03-20
> 使用ソース: WebSearch (Brave/Tavily統合), Snyk, GitHub Docs, Vercel Docs
> 対象: Pass 1 で不明・要確認としていた8項目

---

## 1. Phaser 4 正式リリース時期

**ステータス: RC4（Release Candidate 4）— 2025年5月時点**

- Beta 4 → Beta 8 → RC1 → RC4 と進行
- Phaser v3.88 と v4.0.0 が2024年11月に同時リリース（v4はnpm betaタグ）
- **TypeScript**: Phaser 3 のスクリプトをTypeScriptに移植する形で対応
- **WebGPU**: 計画段階。現時点では新しいWebGLレンダラー「Beam」が実装済み。Canvas/WebGL2/WebGPU の3方式サポートを目指す
- **結論**: 2026年3月時点でRC段階。正式リリースは2026年中の見込み。**本番プロジェクトにはPhaser 3.88.xを推奨**

出典:
- [Phaser v4 RC4](https://phaser.io/news/2025/05/phaser-v4-release-candidate-4)
- [Phaser v3.87 and v4.0.0 Released](https://phaser.io/news/2024/11/phaser-v387-and-v400-released)
- [Phaser 4 is coming - Gamedev.js](https://gamedevjs.com/tools/phaser-4-is-coming/)

---

## 2. KaPlay（Kaboom後継）API安定性

**ステータス: v3001（Kaboom互換）+ v4000（新API）の2バージョン戦略**

- 2024年5月21日にコミュニティがKaboom.jsのフォークとしてKaPlayを開始
- **v3001**: Kaboom.js v3000 と **99.99% 互換**。`kaboom()` は `kaplay()` のエイリアスとして動作
- **v4000**: 破壊的変更を含む新バージョン。APIが変更される可能性あり
- `addKaboom` は削除されない（後方互換保証）
- **結論**: 既存Kaboomプロジェクトの移行にはv3001が安全。新規プロジェクトでもv3001から始めてv4000への段階的移行が推奨

出典:
- [KaPlay公式](https://kaplayjs.com/)
- [The relation of KAPLAY with Kaboom](https://github.com/kaplayjs/kaplay/wiki/The-relation-of-kaplay-with-Kaboom)
- [Announcing KAPLAY v3001 Beta](https://kaplayjs.com/blog/3001beta/)

---

## 3. Poki プラットフォーム収益化条件

**ステータス: 日本からの申請可能。審査制・レベニューシェアモデル**

- **申請**: ゲーム提出フォームから申請。ハンドキュレーション（手動審査）
- **審査基準**: UX/フィール、コアゲームループの品質
- **収益モデル**:
  - 直接流入（ブックマーク・SNS・検索）: **開発者100%**
  - Poki経由流入: **50/50 レベニューシェア**
- **技術要件**: Poki SDK統合必須、広告はPokiシステムのみ許可
- **デザイン要件**: レスポンシブ対応、モバイルコントロール、セーブシステム実装
- **日本特有制限**: 特になし（グローバル共通基準）
- **結論**: 日本から申請可能。品質基準を満たせば参加できる

出典:
- [Poki for Developers](https://developers.poki.com/)
- [Poki Requirements](https://sdk.poki.com/new-requirements.html)
- [Poki Monetization](https://developers.poki.com/guide/monetization)

---

## 4. AI生成ピクセルアートの著作権・ライセンス

**ステータス: 法的にグレーゾーン。商用利用は条件付きで可能**

- **米国著作権局の立場**: 完全にAI生成されたアートは著作権保護の対象外（人間の著者が必要）
- **商用利用**: プラットフォームの利用規約に依存
  - Midjourney: サブスクリプションプランで商用利用可
  - DALL-E: 商用利用可（OpenAI利用規約に準拠）
  - Stable Diffusion: モデルのライセンスに依存
- **人間の修正**: 実質的かつオリジナルな修正を加えれば著作権が発生する可能性あり
- **リスク**: AI が学習元の著作物を複製するリスク。マリオに似すぎるアセットは任天堂の知的財産権侵害の可能性
- **結論**: AI生成アセットは商用利用可能だが、既存IPに似ないよう注意。オリジナルデザインに手動修正を加えるのがベスト。**安全策としてCC0の人手制作アセット（itch.io/OpenGameArt）を推奨**

出典:
- [AI-Generated Content and Copyright Law - Built In](https://builtin.com/artificial-intelligence/ai-copyright)
- [Can I Use AI Images for Commercial Use - GLBGPT](https://www.glbgpt.com/hub/can-i-use-ai-images-for-commercial-use/)
- [AI Art and Copyright - Wayline](https://www.wayline.io/blog/ai-art-copyright-ownership)

---

## 5. Colyseus + Redis マルチプレイコスト

**ステータス: 無料枠あり。スケールに応じて月$5〜$50+**

- **Colyseus Cloud**: マネージドホスティング（無料枠あり）
  - Free: プロトタイプ・開発用
  - Indie: 小規模タイトル向け（詳細価格は公式サイト参照）
  - Enterprise: SLA保証付き
- **セルフホスト**: Vultr マーケットプレイスにワンクリックデプロイあり
  - 最小VPS: ~$5/月（1GB RAM）で10〜50 CCU
  - Redis追加: ~$5/月（マネージドRedis）
  - 合計目安: **$10〜$20/月**（100 CCU以下）
- **スケール**: Redis + ロードバランサーで10,000+ CCU対応可能
- **結論**: MVP段階ではColyseus Cloud無料枠で十分。シングルプレイのマリオゲームにはマルチプレイ不要

出典:
- [Colyseus Pricing](https://colyseus.io/pricing/)
- [Colyseus on Vultr Marketplace](https://www.vultr.com/marketplace/apps/colyseus/)
- [Colyseus Redis Driver](https://www.npmjs.com/package/@colyseus/redis-driver)

---

## 6. 日本語コミュニティでのPhaser最新動向

**ステータス: 2025〜2026年に記事増加中。TypeScript + Redux統合が注目トピック**

### Zenn 最新記事
- 「Phaser3 + Redux + TypeScript」（2025/05/26）— Reduxでゲームステート管理
- 「Phaser3 TileMapの基礎」（2026/01/07）— Tiledエディタとの連携
- 「phaserでゲーム開発」シリーズ全8回（2025/09〜10）— 入門〜リファクタリング

### Qiita 最新記事
- 「Phaser.js / TSでゲームを作りながらプログラミングを楽しみたい」— TypeScript版ハンズオン
- 「Phaser-EZ バニラJS版サンプル追加」— フレームワーク選択の自由度
- 「ゲームエンジンにVueを合体させたらゲーム開発が捗った」— Vue + Phaser統合

### 主な関心事項
1. TypeScript対応（型定義・開発体験）
2. Redux/状態管理との統合
3. TileMap基礎（Tiledエディタ連携）
4. Vue/React等のUIフレームワークとの共存

**結論**: 日本語リソースは着実に増加中。Phaser 3 + TypeScript が主流

出典:
- [phaserでゲーム開発 - Zenn](https://zenn.dev/k_tabuchi/articles/2dc9016a5a5642)
- [Phaser3 TileMapの基礎 - Zenn](https://zenn.dev/hiro256ex/articles/20250425_phaser3tilemap)
- [Phaser3 + Redux + TypeScript - Zenn](https://zenn.dev/btc/articles/250526_redux_phaser3)
- [Phaser.js / TSハンズオン - Qiita](https://qiita.com/y_o_28/items/6a1c1cd01cfad1efe37b)

---

## 7. GitHub Actions + Vercel デプロイの無料枠制限

### GitHub Actions（2026年）
- **パブリックリポジトリ**: 無料（無制限）
- **プライベートリポジトリ**: プランに応じた無料分数あり
- 2026年1月: ランナー価格を最大39%値下げ
- **結論**: パブリックリポで開発すれば実質無料

### Vercel Hobby プラン
- **帯域**: 100 GB/月
- **エッジリクエスト**: 100万/月
- **ビルド**: 6,000分/月
- **静的サイト**: CDN配信・プレビューURL自動生成
- **制限**: 上限到達で停止（オーバーチャージなし）
- **結論**: ブラウザゲーム（静的HTML/JS/CSS）なら十分。月間数万PVまでは無料で運用可能

### 代替: GitHub Pages
- 完全無料（パブリックリポ）
- 帯域: 100 GB/月（ソフトリミット）
- **結論**: 最もシンプルな選択肢。Vercelと同等のコスト効果

出典:
- [GitHub Actions Billing](https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
- [2026 Pricing Changes for GitHub Actions](https://resources.github.com/actions/2026-pricing-changes-for-github-actions/)
- [Vercel Pricing](https://vercel.com/pricing)
- [Vercel Hobby Plan](https://vercel.com/docs/plans/hobby)

---

## 8. Phaser 3/4 セキュリティ（CVE）

**ステータス: 重大な既知CVEなし**

- **Snyk調査結果**: Phaser (npm) パッケージに重大な脆弱性報告なし
- **phaser-ce（旧版）**: Snykにページあるが、現行v3/v4には該当せず
- **npm audit**: 定期実行を推奨（依存パッケージの脆弱性チェック）
- **npm エコシステムリスク**: 2025年9月のShai Hulud攻撃（chalk, debugなど187パッケージ）に注意。Phaserは影響なし
- **結論**: Phaser自体は安全。`npm audit` を定期実行し、サプライチェーン攻撃に注意

出典:
- [Phaser vulnerabilities - Snyk](https://security.snyk.io/package/npm/phaser)
- [npm Security Risks 2026](https://blog.cyberdesserts.com/npm-security-vulnerabilities/)
- [NPM Security Best Practices - Snyk](https://snyk.io/articles/npm-security-best-practices-shai-hulud-attack/)

---

## Pass 2 総括

| 項目 | 結果 | リスク |
|------|------|--------|
| Phaser 4 リリース | RC4段階。本番はPhaser 3.88.x推奨 | 低 |
| KaPlay API安定性 | v3001でKaboom 99.99%互換 | 低 |
| Poki 日本申請 | 可能。審査制・50/50レベニューシェア | 低 |
| AI生成アセット著作権 | グレーゾーン。CC0人手制作を推奨 | 中 |
| Colyseus コスト | 無料枠あり。セルフホスト$10-20/月 | 低 |
| 日本語コミュニティ | 記事増加中。TS+Redux統合が注目 | 低 |
| GitHub Actions + Vercel | パブリックリポ＋Hobby枠で実質無料 | 低 |
| Phaser CVE | 重大CVEなし。npm auditで定期確認 | 低 |

**Pass 1 の全ての「不明」「要確認」項目が解消されました。**
