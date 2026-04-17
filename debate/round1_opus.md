# Round 1: 機能正確性 — Opus Analysis

## Finding 1
**Issue**: 問題1の修正オプションC（Node.js書き直し）は要件を満たさない
**Evidence**: `package.json:7-8` — setup/update が bash 前提。Node.js 書き直しは全ユーザーへの breaking change
**Category**: architecture
**Severity**: high
**推奨**: オプションB（install.ps1 に update ブロック追加）が最小変更で最も要件に整合

## Finding 2
**Issue**: 問題2でオプションA（deep-merge）の「新MCPを自動追加」がユーザーの意図しない副作用を生む
**Evidence**: `install.sh:440-455` REPLACE ロジック vs ccsettings "arrays combined" パターン
**Category**: config
**Severity**: medium
**推奨**: オプションB（additive-only）＋新MCPは disabled:true で追加がベスト

## Finding 3
**Issue**: 問題3でオプションB（fail-fast）は `set -e:14` 既存設定との干渉リスク
**Evidence**: `install.sh:14` set -e 設定済み、各所で `|| true` で選択的無効化
**Category**: architecture
**Severity**: high
**推奨**: オプションA（post-install verification）が安全。fail-fast は全スクリプト再設計が必要
