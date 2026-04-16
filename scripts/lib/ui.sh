#!/bin/bash
# UI helper functions shared by install.sh and update.sh

ok()   { echo "  ✅ $1"; }
warn() { echo "  ⚠️  $1"; }
info() { echo "  ℹ️  $1"; }
fail() { echo ""; echo "  ❌ エラー: $1"; echo "     → $2"; echo ""; exit 1; }
step() { echo ""; echo "━━━ $1 ━━━"; }
