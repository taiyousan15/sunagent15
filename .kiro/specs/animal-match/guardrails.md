# Guardrails: animal-match

> AIガードレール・権限制御・Human-in-Loop 定義 / sdd-full パイプライン生成
> 生成日: 2026-03-19 | spec-slug: animal-match
> 入力: requirements.md (REQ-SEC-001〜004), threat-model.md

---

## 1. ガードレール概要

| 区分 | 対象 | 目的 |
|------|------|------|
| AI出力制御 | Claude Haiku API レスポンス | 不適切コンテンツ・商標語の排除 |
| 権限制御 | ユーザーロール（Free/Premium） | 機能アクセス制限 |
| データ保護 | 個人情報（生年月日・メール） | 最小化・暗号化・RLS |
| レート制御 | 全APIエンドポイント | DoS防止・コスト制御 |
| Human-in-Loop | AI生成テキスト・決済 | 品質保証・不正防止 |

---

## 2. AI出力ガードレール

### GR-AI-001: 商標語フィルタ

| 項目 | 内容 |
|------|------|
| 対象 | Claude Haiku APIの全レスポンス |
| 禁止語 | `動物占い`, `個性心理学`, `動物キャラナビ`, `ISD`, `ノラコム` |
| 実装 | レスポンスJSONをパース後、全テキストフィールドに対して禁止語チェック |
| 検出時 | 該当テキストを静的フォールバックテキストに置換。ログに警告記録 |
| REQ | CON-001 |

```typescript
const BANNED_TERMS = ['動物占い', '個性心理学', '動物キャラナビ', 'ISD', 'ノラコム'];

function sanitizeAiOutput(text: string): string {
  return BANNED_TERMS.reduce(
    (result, term) => result.replaceAll(term, 'アニマルタイプ診断'),
    text
  );
}
```

### GR-AI-002: 不適切コンテンツフィルタ

| 項目 | 内容 |
|------|------|
| 対象 | Claude Haiku APIの診断テキスト |
| チェック対象 | 差別表現、性的表現、暴力表現、政治的内容 |
| 実装 | プロンプトに明示的な制約を含める + レスポンス検証 |
| 検出時 | 静的フォールバックテキストに置換。ログにcritical記録 |
| REQ | - (品質基準) |

**プロンプト制約（Claude Haiku呼び出し時）**:

```
制約:
- 性別、年齢、人種、宗教、性的指向に基づく差別的表現を一切含めないこと
- 「動物占い」「個性心理学」「動物キャラナビ」の語を使用しないこと
- 否定的・攻撃的な表現を避け、建設的なアドバイスに徹すること
- 医療・法律・金融の具体的アドバイスは含めないこと
```

### GR-AI-003: レスポンス構造検証

| 項目 | 内容 |
|------|------|
| 対象 | Claude Haiku APIのJSONレスポンス |
| チェック | Zodスキーマによる構造バリデーション |
| 検証項目 | 全フィールド存在、文字数制限（catchphrase <= 20字）、配列長制限 |
| 失敗時 | パースエラー→静的フォールバック。部分エラー→エラーフィールドのみ置換 |

```typescript
const diagnosisResponseSchema = z.object({
  catchphrase: z.string().max(20),
  marriagePersonality: z.array(z.string()).min(2).max(5),
  strengths: z.array(z.string()).min(1).max(5),
  weaknesses: z.array(z.string()).min(1).max(5),
  idealPartner: z.string().max(100),
  marriageAdvice: z.string().max(150),
});
```

---

## 3. 権限制御ガードレール

### GR-AUTH-001: ロールベースアクセス制御

| ロール | 診断実行 | 結果閲覧 | SNSシェア | マイページ | マッチング | 管理 |
|--------|---------|---------|----------|----------|----------|------|
| Anonymous | ○ | ○ (share_token) | ○ | × | × | × |
| Free | ○ | ○ | ○ | ○ | × | × |
| Premium | ○ | ○ | ○ | ○ | ○ | × |
| Admin | ○ | ○ | ○ | ○ | ○ | ○ (Supabase Dashboard) |

### GR-AUTH-002: Premium機能ゲート

```typescript
// API Route: Premium機能のガード
async function requirePremium(req: NextRequest): Promise<void> {
  const supabase = createServerClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new ApiError(401, 'AUTH_REQUIRED');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  if (profile?.subscription_status !== 'premium') {
    throw new ApiError(403, 'PREMIUM_REQUIRED');
  }
}
```

### GR-AUTH-003: RLSポリシー強制

| テーブル | SELECT | INSERT | UPDATE | DELETE |
|---------|--------|--------|--------|--------|
| users | `auth.uid() = id` | Auth trigger | `auth.uid() = id` | `auth.uid() = id` |
| diagnosis_results | `user_id = auth.uid() OR share_token IS NOT NULL` | `user_id = auth.uid()` | × | `user_id = auth.uid()` |

**チェック**: `SUPABASE_SERVICE_ROLE_KEY` はサーバー側APIルートでのみ使用。クライアント側には `NEXT_PUBLIC_SUPABASE_ANON_KEY` のみ公開。

---

## 4. データ保護ガードレール

### GR-DATA-001: 個人情報最小化

| データ | 収集 | 保存 | 表示 | 外部送信 |
|--------|------|------|------|---------|
| ニックネーム | ○ | ○（users, diagnosis_results） | ○（本人+マッチング相手） | × |
| 生年月日 | ○ | ○（users） | × (本人のみ) | × |
| メールアドレス | ○ | ○（users） | × (本人のみ) | × |
| 動物タイプ | 計算 | ○ | ○（マッチングで公開） | × |
| 診断テキスト | AI生成 | ○ | ○（本人+share_token） | × |

### GR-DATA-002: Claude Haiku APIへのデータ送信制限

| 送信可能 | 送信禁止 |
|---------|---------|
| 動物タイプ名（lion, cheetah等） | ニックネーム |
| アニマルグループ（SUN/EARTH/MOON） | 生年月日 |
| | メールアドレス |
| | user_id |

**実装**: Haiku APIに送信するプロンプトには動物タイプ名のみ含める。ユーザー固有情報は一切送信しない。

### GR-DATA-003: データ削除（退会処理）

```sql
-- CASCADE削除: usersレコード削除時に関連データも自動削除
DELETE FROM users WHERE id = :user_id;
-- → diagnosis_results (user_id FK CASCADE)
-- → Supabase Auth ユーザーも削除 (supabase.auth.admin.deleteUser)
-- → Stripe Customer削除 (stripe.customers.del)
```

---

## 5. レート制御ガードレール

### GR-RATE-001: エンドポイント別レート制限

| エンドポイント | 制限 | 単位 | 理由 |
|--------------|------|------|------|
| POST /api/diagnosis | 5 req | 1分/IP | Haiku APIコスト制御（T-005-1） |
| POST /api/auth/signup | 3 req | 10分/IP | ブルートフォース防止 |
| POST /api/checkout | 3 req | 10分/user | 不正課金防止 |
| GET /api/matches | 30 req | 1分/user | DB負荷制御 |
| GET /api/og | 60 req | 1分/IP | Edge CDNで吸収 |

### GR-RATE-002: コスト上限

| 項目 | 月間上限 | アクション |
|------|---------|----------|
| Claude Haiku API | $50 | 上限到達: 静的テキストフォールバック有効化 |
| Supabase (DB) | Free Tier (500MB) | 80%到達: アラート通知 |
| Vercel | Hobby Plan 制限内 | 超過見込み: Pro Plan移行検討 |

---

## 6. Human-in-Loop ガードレール

### GR-HITL-001: AI生成テキストのレビュー

| 項目 | 内容 |
|------|------|
| 対象 | Claude Haiku APIが初回生成する12動物タイプの診断テキスト |
| タイミング | Phase1開発中（リリース前）にすべて生成しレビュー |
| レビュー者 | サービス運営者 |
| チェック項目 | 商標語不使用、差別表現なし、建設的内容、文字数制限内 |
| 承認後 | 承認済みテキストをキャッシュ（静的データ化） |
| Phase2以降 | 動的生成を検討する場合、GR-AI-001〜003の自動チェックに加えて月次サンプルレビュー |

### GR-HITL-002: 決済トラブル対応

| 項目 | 内容 |
|------|------|
| 対象 | Stripe課金に関するユーザーからの問い合わせ |
| タイミング | 問い合わせ受信時 |
| 対応者 | サービス運営者 |
| 手順 | Stripe Dashboard で取引確認 → 返金 or ステータス修正 |
| 自動化範囲 | Webhook処理のみ自動。返金は手動承認必須 |

### GR-HITL-003: コンテンツ報告対応

| 項目 | 内容 |
|------|------|
| 対象 | ユーザーからの不適切コンテンツ報告（Phase2以降） |
| Phase1 | 報告機能未実装（Non-Goal）。お問い合わせフォーム経由 |
| 対応者 | サービス運営者 |
| 手順 | 報告内容確認 → 該当テキスト差し替え → 再発防止（プロンプト改善） |

---

## 7. ガードレール↔脅威 トレーサビリティ

| ガードレール | 対応脅威 | REQ |
|-------------|---------|-----|
| GR-AI-001 商標語フィルタ | - | CON-001 |
| GR-AI-002 不適切コンテンツ | - | 品質基準 |
| GR-AI-003 レスポンス構造検証 | - | REQ-003 |
| GR-AUTH-001 ロールベースAC | T-006-1 | REQ-SEC-001, REQ-008 |
| GR-AUTH-002 Premiumゲート | T-006-1 | REQ-008 |
| GR-AUTH-003 RLS強制 | T-001-1, T-002-2, T-004-1 | REQ-SEC-001 |
| GR-DATA-001 個人情報最小化 | T-004-1 | REQ-903 |
| GR-DATA-002 API送信制限 | T-004-1 | REQ-903 |
| GR-DATA-003 データ削除 | T-004-1 | REQ-903 |
| GR-RATE-001 レート制限 | T-005-1, T-005-3 | REQ-SEC-004 |
| GR-RATE-002 コスト上限 | T-005-1 | REQ-SEC-004 |
| GR-HITL-001 AIテキストレビュー | GR-AI-001,002 | 品質基準 |
| GR-HITL-002 決済対応 | T-003-1 | REQ-007 |
