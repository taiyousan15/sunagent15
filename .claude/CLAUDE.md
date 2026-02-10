# TAISUN v2 - Ultimate Unified System

## WORKFLOW FIDELITY CONTRACT（絶対遵守契約）

```
┌─────────────────────────────────────────────────────────────────────┐
│  この契約は、AIの行動を制約する最上位ルールです。                    │
│  いかなる状況でも、この契約に違反することは許可されません。          │
└─────────────────────────────────────────────────────────────────────┘
```

### 1. 指示の忠実な実行（契約）
ユーザーが「同じワークフロー」「指定スキルを使う」と言ったら、それは**契約**です。
- 短縮・簡略化・置換は**禁止**
- 「シンプルにする」「最適化する」「より良くする」は**逸脱**として扱う
- 逸脱が必要な場合は、**必ず事前に承認を得る**

### 2. 既存成果物の尊重
- **Readせずに新規スクリプト/別手順を作らない**
- **改変する前に必ずReadで内容を確認する**
- **ベースラインとして登録されたファイルは改変禁止**

### 3. 勝手な行動の禁止
指示にない行動（逸脱）をする場合：
1. **必ず「この行動は指示にありません。実行してよいですか？」と確認する**
2. **ユーザーの明示的な承認を得てから実行する**
3. **承認なしに逸脱することは絶対禁止**

### 4. セッション継続時の状態確認
- `.workflow_state.json` の内容を確認（自動注入される）
- `SESSION_HANDOFF.md` があれば必ず読む
- 現在のフェーズと矛盾する行動をしない

### 5. スキル指定の遵守
「〇〇スキルを使って」という指示がある場合：
- **必ずSkillツールで呼び出す**
- 手動実装は**絶対禁止**

### 6. 13層防御システム
| Layer | Guard | 機能 |
|-------|-------|------|
| 0 | CLAUDE.md | 絶対遵守ルール |
| 1 | SessionStart Injector | 状態の自動注入 |
| 2 | Permission Gate | フェーズ外操作をブロック |
| 3 | Read-before-Write | 未読ファイル編集をブロック |
| 4 | Baseline Lock | 重要スクリプト改変をブロック |
| 5 | Skill Evidence | スキル証跡なしで後工程ブロック |
| 6 | Deviation Approval | 勝手な行動の事前承認要求 |
| 7 | Agent Enforcement | 複雑タスクでエージェント使用を強制 |
| 8 | Copy Safety | U+FFFD/U+3000/コピーマーカーをブロック |
| 9 | Input Sanitizer | コマンドインジェクション/機密情報漏洩を検出 |
| 10 | Skill Auto-Select | タスク種別から必須スキルを自動強制 |
| 11 | Definition Lint | workflow/policy定義の検証 |
| 12 | Context Quality | tmux推奨 + console.log警告 |

**違反はexit code 2でブロックされます。**

### 7. スキル自動マッピング
| トリガー | 必須スキル | strict |
|----------|------------|--------|
| YOUTUBE + 教材 + 動画 | youtubeschool-creator | Yes |
| セールスレター | taiyo-style-sales-letter | No |
| ステップメール | taiyo-style-step-mail | No |
| VSL台本 | taiyo-style-vsl | No |
| Instagram + Shorts | shorts-create | Yes |
| **インタラクティブ動画/分岐動画/VSL動画** | **interactive-video-platform** | **Yes** |
| **TTS/音声生成/ナレーション** | **interactive-video-platform** | **Yes** |
| **画像品質チェック/ビジュアルQA** | **agentic-vision** | **No** |
| **電話/架電/通話/Voice AI** | **voice-ai** | **No** |
| **SDR/営業パイプライン/リード管理** | **ai-sdr** | **No** |
| **リードスコアリング/リード評価** | **lead-scoring** | **No** |
| **アウトリーチ/メッセージ送信** | **outreach-composer** | **No** |
| **URL分析/サイト解析/ページ構造/リンク抽出** | **url-deep-analysis** | **No** |

#### マルチメディアパイプライン必須フェーズ（interactive-video-platform）
```
Phase 2a: IMAGE → NanoBanana Pro / flow-image
Phase 2b: QA → agentic-vision 品質チェック
Phase 2c: TEXT_VERIFY → japanese-text-verifier
Phase 2d: TTS → Fish Audio（macOS say 禁止）
Phase 2e: COMPOSE → Remotion
```

---

## System Overview

| Component | Count | Description |
|-----------|-------|-------------|
| Agents | 86 | `/agent-catalog` で詳細確認 |
| Skills | 71 | `/skill-catalog` で詳細確認 |
| Commands | 82 | ショートカットコマンド |
| MCP Servers | 8 | filesystem, pexels, pixabay, puppeteer, browser-use, playwright, voice-ai, ai-sdr |

---

## MANDATORY PRE-FLIGHT CHECKS

```
┌─────────────────────────────────────────────────────────────┐
│  STOP! このチェックリストを完了するまで作業を開始するな     │
└─────────────────────────────────────────────────────────────┘
```

### 作業開始前チェック
- [ ] ユーザーが「〇〇スキルを使って」と言っていないか？ → **Skillツールで呼び出せ**
- [ ] 「同じワークフロー」「前回と同じ」という指示はないか？ → **既存ファイルをReadせよ**
- [ ] `SESSION_HANDOFF.md`があるか？ → **必ず読んでから作業開始**
- [ ] 要約比率が指定されているか？ → **その比率を厳守**

### VIOLATION = CRITICAL ERROR
違反した場合：即座に停止 → 謝罪 → `.claude/hooks/mistakes.md`に記録 → 正しい手順で再実行

---

## Guidelines

### Context Management
| 項目 | 推奨値 |
|------|--------|
| 有効化MCP | 10個以下 |
| アクティブツール | 80個以下 |

詳細: `.claude/rules/context-management.md`

### Development
1. **TDD First** - テスト駆動開発
2. **Clean Architecture** - レイヤー分離
3. **SOLID Principles** - 設計原則遵守
4. **Security by Design** - セキュリティ組み込み

### Quality Gates
- コードレビュー: 80点以上
- テストカバレッジ: 80%以上
- セキュリティ: Critical/High脆弱性ゼロ

---

## Quick Reference

詳細は `/quick-reference` で確認。

```bash
# 基本コマンド
/agent-run          # エージェント実行
/-status      # 状態確認
/mcp-health         # MCP診断

# カタログ参照
/agent-catalog      # 82エージェント詳細
/skill-catalog      # 66スキル詳細
/quick-reference    # 高度な機能ガイド
```

---

## Language
- 日本語優先
- 技術用語は英語可
- マーケティング専門用語を適切に使用
