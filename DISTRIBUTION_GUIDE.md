# TAISUN Agent v2.4.1 - 配布ガイド

このドキュメントは、TAISUN Agent v2.4.1 を他の人に渡す時の手順書です。

---

## 📦 配布物一覧

### 必須ファイル

1. **リリースノート**
   - `RELEASE_v2.4.0.md` - Workflow Guardian Phase 3
   - `RELEASE_v2.4.1.md` - Super Memory Phase 3（完全自動化）

2. **変更履歴**
   - `CHANGELOG.md` - 全バージョンの変更履歴

3. **クイックスタート**
   - `docs/WORKFLOW_PHASE3_QUICKSTART.md` - ワークフロー機能ガイド
   - `docs/SUPER_MEMORY_README.md` - スーパーメモリー機能ガイド

4. **Phase 3 Super Memory 必須ファイル**
   ```
   .claude/settings.json              # フック設定（Phase 3形式）
   .claude/hooks/auto-memory-saver.js # 自動保存フック
   .claude/hooks/workflow-guard-bash.sh  # Bashコマンドガード
   .claude/hooks/workflow-guard-write.sh # ファイル書き込みガード
   config/proxy-mcp/auto-memory.json  # 自動保存設定
   ```

5. **コード一式**
   - Git リポジトリ全体

---

## 🚀 配布方法

### 方法1：Git経由（推奨）

```bash
# リモートリポジトリにプッシュ
git push origin main
git push origin v2.4.0

# 受け取る人の操作
git clone <repository-url>
cd taisun_agent
git checkout v2.4.0
npm install
```

### 方法2：ZIPファイル

```bash
# アーカイブ作成
git archive --format=zip --output=taisun_agent_v2.4.0.zip v2.4.0

# 配布
# → taisun_agent_v2.4.0.zip を渡す
```

### 方法3：GitHub Release（一番簡単）

1. GitHubのリポジトリページを開く
2. "Releases" → "Create a new release"
3. タグ: `v2.4.0` を選択
4. タイトル: `TAISUN Agent v2.4.0 - Workflow Guardian Phase 3`
5. 説明: `RELEASE_v2.4.0.md` の内容をコピペ
6. "Publish release" をクリック

---

## 📧 配布時のメッセージテンプレート

### Slackやメール用

```
【TAISUN Agent v2.4.0 リリースのお知らせ】

ワークフローシステムがパワーアップしました！🎉

＜主な新機能＞
📍 条件分岐 - 状況に応じて次の手順が自動で変わる
⚡ 並列実行 - 複数の作業を同時に進められる
🔄 ロールバック - 前の段階にやり直せる

＜使い始めるには＞
1. git pull origin main
2. npm install
3. docs/WORKFLOW_PHASE3_QUICKSTART.md を読む

詳細はリポジトリの RELEASE_v2.4.0.md をご覧ください。

質問があればお気軽にどうぞ！
```

---

## 📋 受け取った人がやること

### ステップ1：インストール（2分）

```bash
# リポジトリを取得（初回のみ）
git clone <repository-url>
cd taisun_agent

# または、既にある人は更新
git pull origin main
git checkout v2.4.1

# 依存パッケージをインストール
npm install

# フックスクリプトに実行権限を付与
chmod +x .claude/hooks/*.sh .claude/hooks/*.js
```

### ステップ2：動作確認（3分）

```bash
# バージョン確認
cat package.json | grep version
# → "version": "2.4.1" と表示されればOK

# テスト実行
npm test -- --selectProjects=workflow-phase3 --runInBand
# → 50 tests passed と表示されればOK ✅

# Phase 3 Super Memory テスト
echo '{"tool_name":"Test","tool_response":"test"}' | node .claude/hooks/auto-memory-saver.js
# → エラーなく終了すればOK ✅
```

### ステップ3：Phase 3 Super Memory 確認（2分）

```bash
# 設定ファイル確認
cat .claude/settings.json | grep -A 5 '"hooks"'
# → "PostToolUse", "PreToolUse", "SessionEnd" が設定されていればOK

# 自動保存設定確認
cat config/proxy-mcp/auto-memory.json | grep '"enabled"'
# → "enabled": true と表示されればOK
```

### ステップ4：使い始める（5分）

```bash
# ワークフロー機能
npm run workflow:start video_generation_v1

# スーパーメモリー機能
# → 自動で動作！50KB以上の出力は自動保存されます
# → セッション終了時に統計が表示されます
```

---

## ❓ よくある質問（FAQ）

### Q1: 既存のワークフローは動く？

**A: はい！** 完全な後方互換性があります。Phase 1/2 のワークフローはそのまま動きます。

### Q2: 新機能を使うには設定が必要？

**A: いいえ！** 新しいワークフロー定義を書くだけで使えます。

### Q3: テストが失敗する

**A: `--runInBand` を付けてください**

```bash
npm test -- --selectProjects=workflow-phase3 --runInBand
```

### Q4: どこから始めればいい？

**A: クイックスタートから！**

```bash
# 5分で基本を学べます
cat docs/WORKFLOW_PHASE3_QUICKSTART.md
```

---

## 🆘 サポート

### 困った時の連絡先

- **GitHub Issues**: バグ報告・機能要望
- **Discord**: 質問・相談
- **メール**: 個別サポート

### よく読まれるドキュメント

1. `RELEASE_v2.4.0.md` - 全体像を把握
2. `docs/WORKFLOW_PHASE3_QUICKSTART.md` - 実践的なチュートリアル
3. `CHANGELOG.md` - 詳細な変更履歴

---

## 📊 チェックリスト

配布前に確認してください：

- [ ] テストが全て通る（50/50 PASS）
- [ ] ドキュメントが最新
- [ ] バージョン番号が正しい（2.4.0）
- [ ] Gitタグが作成されている（v2.4.0）
- [ ] コミットがプッシュされている

受け取った人が確認すること：

- [ ] git pull / git clone できた
- [ ] npm install が成功した
- [ ] バージョンが 2.4.0 になっている
- [ ] テストが通る（--runInBand 付き）
- [ ] サンプルワークフローが動く

---

## 🎓 学習パス

おすすめの学習順序：

1. **まず読む**（10分）
   - RELEASE_v2.4.0.md - 何ができるか理解

2. **実践する**（15分）
   - docs/WORKFLOW_PHASE3_QUICKSTART.md - 手を動かす

3. **応用する**（30分）
   - 自分の仕事の流れをワークフローにしてみる

4. **深掘りする**（必要に応じて）
   - docs/WORKFLOW_PHASE3_DESIGN.md - 設計を理解
   - テストコードを読む - 実装を学ぶ

---

## 📅 リリース情報

- **バージョン**: 2.4.0
- **リリース日**: 2026年1月15日
- **前バージョン**: 2.3.0
- **次の予定**: Phase 4（スケジューリング・通知機能）

---

**配布準備完了！** 🚀

何か問題があれば、すぐに連絡してください。
