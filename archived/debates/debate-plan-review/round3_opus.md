# Round 3: エラー処理 — Opus Analysis

## Finding 1
**Issue**: 移動中の中間状態 — `mv` 実行後、参照修正前にhookが発火したらどうなるか
**Evidence**: 全hookはfs.existsSync(mistakesPath)で存在チェックしてから読む（workflow-sessionstart-injector.js:82, session-continue-guard.js:93, violation-recorder.js:32）。ファイルが見つからなければ単にスキップ（fail-open設計）
**Category**: code
**Severity**: medium
**Verdict**: fail-open設計により中間状態でもクラッシュしない。ただし移動→修正は同一セッションで連続実行すべき。

## Finding 2
**Issue**: mistake-pattern-matcher.js の MISTAKES_FILE が見つからない場合の挙動
**Evidence**: line 33-39でファイル読み込み。読めない場合patternsは空配列→マッチングが無効化されるだけ（line 72でearly return）。クラッシュしない
**Category**: code
**Severity**: medium
**Verdict**: fail-openで安全。ただしパターンマッチが一時的に無効になる点は認識しておくべき。

## Finding 3
**Issue**: git上でファイル移動の追跡 — `git mv` vs `mv` + `git add`
**Evidence**: `git mv` を使えばgitが移動を自動追跡。手動 `mv` でも `git add` でgitは移動と認識可能。ただしgitignore対象でないことを確認要
**Category**: config
**Severity**: low
**Verdict**: `git mv .claude/hooks/mistakes.md .claude/rules/mistakes.md` を使うべき。
