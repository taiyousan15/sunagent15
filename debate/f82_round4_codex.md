# R4運用

## 指摘1
Severity:中
説明:`.claude/**`が`docs`扱いで、`.claude`更新でも`smoke`実行 (`ci.yml:48-51,318`)。
代替案:`skills` filterを追加し`.claude/skills/*/SKILL.md`と関連変更時起動 (`ci.yml:31-35`)。

## 指摘2
Severity:低
説明:`requires.tools`違反が`must match`のみで修正例なし (`check-skill-requirements.js:102`)。
代替案:規約名+例(`ffmpeg`,`yt-dlp`)併記 (`check-skill-requirements.js:35,102`)。

## 指摘3
Severity:中
説明:validatorはconsoleのみでsummary未出力 (`check-skill-requirements.js:196-204`)。
代替案:CIで`tee`結果を`$GITHUB_STEP_SUMMARY`へ追記 (`ci.yml:401-411`)。
