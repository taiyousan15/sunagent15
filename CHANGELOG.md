# Changelog

このファイルは TAISUN Agent の全ての重要な変更を記録します。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づいており、
バージョン管理は [Semantic Versioning](https://semver.org/lang/ja/) に従います。

---

## [2.4.1] - 2026-01-18

### 🎉 追加 (Added)

#### Phase 3 Super Memory - 完全自動化

**自動保存機能**
- `PostToolUse` フック: 50KB超の出力を自動保存
- `PreToolUse` フック: 危険なコマンドをブロック
- `SessionEnd` フック: セッション統計表示
- stdin JSON入力対応（Claude Code仕様準拠）

**効果**
- コンテキスト削減: 97%
- コスト削減: 99.5%
- 年間削減額: $1,130+
- 追加コスト: $0（ローカル保存のみ）

**更新ファイル**
- `.claude/settings.json` - 新フック形式に更新
- `.claude/hooks/auto-memory-saver.js` - PostToolUse統合
- `.claude/hooks/workflow-guard-bash.sh` - stdin JSON対応
- `.claude/hooks/workflow-guard-write.sh` - stdin JSON対応

**ドキュメント**
- `RELEASE_v2.4.1.md` - リリースノート
- `docs/SUPER_MEMORY_STATUS.md` - Phase 3完了ステータス
- `DISTRIBUTION_GUIDE.md` - 配布手順更新

---

## [2.4.0] - 2026-01-15

### 🎉 追加 (Added)

#### Workflow Guardian Phase 3 - 高度なワークフロー機能

**条件分岐 (Conditional Branching)**
- `file_content`: ファイル内容に基づく条件分岐
- `file_exists`: ファイル存在チェックによる分岐
- `metadata_value`: ワークフローメタデータによる動的分岐
- 正規表現パターンマッチング対応
- デフォルトフォールバック機能

**並列実行 (Parallel Execution)**
- `parallelNext`: 複数フェーズの並列実行
- `waitStrategy: all` - 全フェーズ完了まで待機
- `waitStrategy: any` - いずれか1フェーズ完了で次へ
- 並列実行状態の追跡と可視化
- 並列実行履歴の記録

**ロールバック (Rollback)**
- `rollbackToPhase()`: 指定フェーズへのロールバック
- `allowRollbackTo`: ロールバック可能フェーズの制限
- ロールバック履歴の記録とスナップショット保存
- 理由の記録機能

**新しいドキュメント**
- `docs/WORKFLOW_PHASE3_QUICKSTART.md` - 5分でわかるクイックスタート
- `docs/WORKFLOW_PHASE3_GUIDE.md` - 完全ガイド（予定）
- `docs/WORKFLOW_PHASE3_DESIGN.md` - 設計仕様書
- `RELEASE_v2.4.0.md` - リリースノート

**テストスイート**
- 50個の自動テスト（全て合格）
  - 条件分岐テスト: 12個
  - 並列実行テスト: 6個
  - 統合テスト: 6個
  - ロールバックテスト
  - 型定義テスト

### 🔧 修正 (Fixed)

**ワークフロー状態管理**
- ワークフロー定義の読み込みタイミングを修正
- テストにおける `clearCache()` の実行順序を修正
- ファイルシステム競合時の処理を改善

**テストの安定性向上**
- `clearState()`: ENOENT エラーのハンドリング追加
- `saveState()`: 一時ファイルクリーンアップのエラーハンドリング
- 並列テスト実行時の競合問題を解決

**Jest設定**
- workflow-phase3 プロジェクトの `maxWorkers: 1` 設定
- `--runInBand` フラグの推奨を明記

### 📖 ドキュメント (Documentation)

- Phase 3 の全機能を網羅したドキュメント追加
- 初心者向けクイックスタートガイド
- 実践的なサンプルワークフロー
- トラブルシューティングガイド

### ⚠️ 重要な注意事項 (Important Notes)

**テスト実行**
```bash
# Phase 3 テストは必ず --runInBand で実行
npm test -- --selectProjects=workflow-phase3 --runInBand
```

**互換性**
- 既存の Phase 1/2 ワークフローとの完全な後方互換性
- 新機能は段階的に追加可能

---

## [2.3.0] - 2026-01-12

### 追加

**Workflow Guardian Phase 2 - Strict Mode**
- 厳格モードによる強制的な成果物チェック
- スキルガード機能
- ワークフロー外でのツール使用禁止

**Auto-Memory Phase 3**
- コンテキスト自動保存
- 大量出力の自動圧縮
- 97%のコンテキスト削減

### 修正
- ワークフローフック統合の改善
- 状態管理の安定性向上

---

## [2.2.0] - 2026-01-10

### 追加

**Workflow Guardian Phase 1 - 基本機能**
- 線形ワークフローの実装
- フェーズ遷移管理
- 成果物検証
- 進捗追跡

**OpenCode/OMO Integration**
- 組織記憶システム統合
- セッション連続性の確保

---

## [2.1.0] - 2025-12-20

### 追加
- MCP Server 統合
- 81 エージェント統合
- 67 スキル実装

---

## [2.0.0] - 2025-11-15

### 追加
- TAISUN v2 の初回リリース
- 統合開発システムの基盤構築

---

## 記号の意味

- 🎉 追加 (Added) - 新機能
- 🔧 修正 (Fixed) - バグ修正
- 📖 ドキュメント (Documentation) - ドキュメント変更
- ⚠️ 重要 (Important) - 注意が必要な変更
- 🗑️ 削除 (Removed) - 削除された機能
- 🔒 セキュリティ (Security) - セキュリティ関連
- ⚡ パフォーマンス (Performance) - パフォーマンス改善
