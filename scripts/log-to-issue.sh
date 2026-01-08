#!/bin/bash
# 作業ログを自動的にGitHub Issueに作成するスクリプト

set -e

# 設定
REPO="san15/testikeda"
LOG_DIR="${LOG_DIR:-./logs}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DATE=$(date '+%Y-%m-%d')

# ログディレクトリが存在しない場合は作成
mkdir -p "$LOG_DIR"

# 引数からログタイトルとメッセージを取得
TITLE="${1:-作業ログ: $DATE}"
MESSAGE="${2:-}"

# メッセージが指定されていない場合は、最近のgitログから生成
if [ -z "$MESSAGE" ]; then
    # 最近のコミットログを取得
    RECENT_COMMITS=$(git log --oneline --since="24 hours ago" --no-merges | head -5)

    # git statusを取得
    GIT_STATUS=$(git status --short 2>/dev/null || echo "No changes")

    # テスト結果を取得（存在する場合）
    TEST_RESULTS=""
    if [ -f "test-results.txt" ]; then
        TEST_RESULTS=$(cat test-results.txt)
    fi

    # メッセージを構築
    MESSAGE=$(cat <<EOF
## 作業ログ

### 実行日時
$TIMESTAMP

### 最近のコミット
\`\`\`
$RECENT_COMMITS
\`\`\`

### Git Status
\`\`\`
$GIT_STATUS
\`\`\`

### テスト結果
$TEST_RESULTS

---
🤖 自動生成されたログ
EOF
)
fi

# ログをファイルに保存
LOG_FILE="$LOG_DIR/log-$DATE.md"
echo "$MESSAGE" > "$LOG_FILE"
echo "ログを保存しました: $LOG_FILE"

# GitHub Issueを作成
echo "GitHub Issueを作成中..."
ISSUE_URL=$(gh issue create \
    --repo "$REPO" \
    --title "$TITLE" \
    --body "$MESSAGE")

echo "✅ Issue作成完了: $ISSUE_URL"

# Issue URLをログファイルに追記
echo "" >> "$LOG_FILE"
echo "Issue URL: $ISSUE_URL" >> "$LOG_FILE"
