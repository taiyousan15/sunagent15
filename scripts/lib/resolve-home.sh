#!/bin/bash
# Resolve TAISUN_HOME with 3-tier fallback.
# For scripts (reliable script location): script-location > TAISUN_HOME env > CLI arg
# Usage: source this file, then use $TAISUN_HOME

resolve_taisun_home() {
  local cli_arg="${1:-}"
  local from_script
  from_script="$(cd "$(dirname "${BASH_SOURCE[1]:-$0}")/.." 2>/dev/null && pwd)"

  if [ -n "$cli_arg" ] && [ -d "$cli_arg" ]; then
    TAISUN_HOME="$cli_arg"
  elif [ -n "$from_script" ] && [ -f "$from_script/package.json" ]; then
    TAISUN_HOME="$from_script"
  elif [ -n "$TAISUN_HOME" ] && [ -d "$TAISUN_HOME" ]; then
    : # already set via env
  else
    echo "  ERROR: Cannot determine TAISUN_HOME" >&2
    return 1
  fi
  export TAISUN_HOME
}

persist_taisun_home() {
  local config_dir="$HOME/.config/taisun"
  local env_file="$config_dir/env"
  mkdir -p "$config_dir"
  echo "export TAISUN_HOME=\"$TAISUN_HOME\"" > "$env_file"

  local marker_start="# >>> taisun >>>"
  local marker_end="# <<< taisun <<<"
  local source_line="[ -f \"$env_file\" ] && source \"$env_file\""

  for rc in "$HOME/.zshrc" "$HOME/.bashrc"; do
    [ -f "$rc" ] || continue
    if grep -q "$marker_start" "$rc" 2>/dev/null; then
      : # already present
    else
      printf '\n%s\n%s\n%s\n' "$marker_start" "$source_line" "$marker_end" >> "$rc"
    fi
  done
}

refresh_taisun_home() {
  local env_file="$HOME/.config/taisun/env"
  if [ -f "$env_file" ]; then
    local stored
    stored="$(grep 'TAISUN_HOME=' "$env_file" | head -1 | cut -d'"' -f2)"
    if [ -n "$stored" ] && [ "$stored" != "$TAISUN_HOME" ]; then
      echo "export TAISUN_HOME=\"$TAISUN_HOME\"" > "$env_file"
      return 0
    fi
  fi
  return 1
}
