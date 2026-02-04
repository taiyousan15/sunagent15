---
name: security-scan-trivy
description: |
  Trivyで依存関係/コンテナの脆弱性をスキャン。リリース前セキュリティチェック。
  Use when: (1) user says「脆弱性スキャン」「セキュリティチェック」「Trivy」,
  (2) user wants vulnerability scanning,
  (3) user mentions「依存関係チェック」「コンテナスキャン」「CVE」.
  Do NOT use for: コードレビュー（code-reviewerを使用）、
  セキュリティ設計（security-architectを使用）。
---

# Trivy Security Scan

## Instructions

- まずCritical/Highを対象にする
- 例外（許容する脆弱性）は理由と期限を必ず残す
- CIに組み込む場合は「最初は警告→次にfail」に段階導入

