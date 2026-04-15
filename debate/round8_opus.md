# Round 8: テスタビリティ — Opus Analysis

## Finding 1
**Issue**: 問題1でupdate.ps1（オプションB）を追加した場合、Windows CI（GitHub Actions windows-latest）でのテストが現在ない
**Evidence**: .github/workflows/ci.ymlにWindows-specificなテストステップが存在しない（Explore調査結果）
**Category**: test
**Severity**: high
**推奨**: update.ps1追加と同時にGitHub Actions windows-latestジョブでinstall→update→verifyの統合テストを追加

## Finding 2
**Issue**: 問題2でdeep-merge（オプションA）の実装は単体テストが書きやすい（入力JSON + 期待出力JSONのペアテスト）
**Evidence**: install.sh:440-455のNode.jsインラインスクリプト — 独立関数として抽出すればjestでテスト可能
**Category**: test
**Severity**: medium
**推奨**: merge関数をsrc/utils/settings-merge.tsとして分離 → jestでテスト。オプションAまたはBいずれでも同様に実装可能

## Finding 3
**Issue**: 問題3でpost-install verification（オプションA）自体のテストがない — verificationが間違った判定をしても検知できない
**Evidence**: jest.config.jsにinstall系テストプロジェクトなし。scripts/*.shのテストも不在（Explore調査結果）
**Category**: test
**Severity**: medium
**推奨**: verificationスクリプトのモックテスト（正常/失敗各ケース）を追加。これはオプションA実装と同時に行うべき
