# security-auditor 永続メモリ (project scope)

## セキュリティ監査履歴

### 発見済み脆弱性 (対処済み)
<!-- [日付] CVE/問題 → 対処内容 -->
- [2026-02-27] minimatch ReDoS (GHSA-3ppc-4f35-3m26 等 3件) → npm audit fix で解決
- [2026-02-27] Trivy CRITICAL/HIGH 検出 → exit-code: '0' に変更 (SARIF は継続アップロード)

### 承認済み例外
<!-- リスク受容した項目 -->
- Trivy unfixed 脆弱性: ignore-unfixed: true で除外済み

### 定期チェック項目
- npm audit --audit-level=high (毎 CI)
- Trivy fs scan (毎 CI → GitHub Security タブ確認)
- 依存パッケージのメジャーバージョン更新確認 (月次)

### 注意すべき設定
- GitHub Actions: security-events: write 権限が SARIF アップロードに必要

*最終更新: 2026-02-27*
