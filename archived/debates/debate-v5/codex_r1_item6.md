# Item 6 Verification: install.sh/update.sh UI Helper Duplication

## Verdict
CONFIRMED — `install.sh` and `update.sh` duplicate the `ok/warn/info/step` UI helpers (with only `fail()` extra in `install.sh`), and extraction to a new `scripts/lib/ui.sh` is feasible.

## Evidence

### 1. Diff of specified ranges
Command run:
`diff <(sed -n '100,110p' scripts/install.sh) <(sed -n '12,20p' scripts/update.sh)`

Raw diff output:
```diff
7d6
< fail() { echo ""; echo "  ❌ エラー: $1"; echo "     → $2"; echo ""; exit 1; }
11d9
< # ヘッダー
```

Independent range inspection commands run:
`nl -ba scripts/install.sh | sed -n '100,107p'`
`nl -ba scripts/update.sh | sed -n '12,18p'`

Raw output:
```text
   100	# ─────────────────────────────────────────
   101	# 表示ヘルパー
   102	# ─────────────────────────────────────────
   103	ok()   { echo "  ✅ $1"; }
   104	warn() { echo "  ⚠️  $1"; }
   105	info() { echo "  ℹ️  $1"; }
   106	fail() { echo ""; echo "  ❌ エラー: $1"; echo "     → $2"; echo ""; exit 1; }
   107	step() { echo ""; echo "━━━ $1 ━━━"; }

    12	# ─────────────────────────────────────────
    13	# 表示ヘルパー
    14	# ─────────────────────────────────────────
    15	ok()   { echo "  ✅ $1"; }
    16	warn() { echo "  ⚠️  $1"; }
    17	info() { echo "  ℹ️  $1"; }
    18	step() { echo ""; echo "━━━ $1 ━━━"; }
```

### 2. Duplicate line count
Exact helper block ranges used for counting:
- `scripts/install.sh:100-107`
- `scripts/update.sh:12-18`

Method 1 (multiset line intersection) command run:
`awk 'NR==FNR{c[$0]++; next} {if(c[$0]>0){d++; c[$0]--}} END{print d}' <(sed -n '100,107p' scripts/install.sh) <(sed -n '12,18p' scripts/update.sh)`

Raw output:
```text
7
```

Method 2 (cross-check) command run:
`comm -12 <(sed -n '100,107p' scripts/install.sh | sort) <(sed -n '12,18p' scripts/update.sh | sort) | wc -l`

Raw output:
```text
       7
```

Helper-name cross-check command run:
`grep -nE '^(ok|warn|info|step)\(\)' scripts/install.sh scripts/update.sh`

Raw output:
```text
scripts/install.sh:103:ok()   { echo "  ✅ $1"; }
scripts/install.sh:104:warn() { echo "  ⚠️  $1"; }
scripts/install.sh:105:info() { echo "  ℹ️  $1"; }
scripts/install.sh:107:step() { echo ""; echo "━━━ $1 ━━━"; }
scripts/update.sh:15:ok()   { echo "  ✅ $1"; }
scripts/update.sh:16:warn() { echo "  ⚠️  $1"; }
scripts/update.sh:17:info() { echo "  ℹ️  $1"; }
scripts/update.sh:18:step() { echo ""; echo "━━━ $1 ━━━"; }
```

Duplicated line count: **7**.

### 3. scripts/lib/ existence
Command run:
`ls -la scripts/lib/ 2>&1`

Raw output:
```text
ls: scripts/lib/: No such file or directory
```

## Feasibility of proposed fix (scripts/lib/ui.sh)
- Shared helper duplication is real (`ok/warn/info/step` are identical across both scripts), so centralization is technically justified.
- `scripts/lib/` does not currently exist, so extraction requires creating `scripts/lib/` and `scripts/lib/ui.sh`.
- `install.sh` has an extra `fail()` helper; extraction can still be straightforward by either keeping `fail()` local to `install.sh` or moving it to shared lib and unused in `update.sh`.
- Both scripts are bash (`#!/usr/bin/env bash`), so sourcing a shared `scripts/lib/ui.sh` is structurally straightforward.
