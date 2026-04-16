#!/bin/bash
# Shared skill/agent registration functions for install.sh and setup-project.sh

register_skills() {
  local source_dir="$1"
  local target_dir="$2"
  local allowed_filter="${3:-}"
  local installed=0 updated=0 skipped=0 profile_skipped=0

  mkdir -p "$target_dir"
  [ -d "$source_dir" ] || return 0

  for skill_dir in "$source_dir"/*/; do
    local skill_name
    skill_name=$(basename "$skill_dir")
    [[ "$skill_name" == "_archived" || "$skill_name" == "_guides" || "$skill_name" == "data" ]] && continue
    [[ ! -f "$skill_dir/SKILL.md" ]] && [[ ! -f "$skill_dir/CLAUDE.md" ]] && continue

    if [ -n "$allowed_filter" ]; then
      if ! echo "$allowed_filter" | grep -qx "$skill_name"; then
        ((profile_skipped++)) || true
        continue
      fi
    fi

    local target="$target_dir/$skill_name"
    if [ -d "$target" ] && [ ! -L "$target" ]; then rm -rf "$target"; fi

    if [ ! -L "$target" ]; then
      ln -sf "$skill_dir" "$target"
      ((installed++)) || true
    else
      local current_target
      current_target=$(readlink "$target")
      if [ "$current_target" != "$skill_dir" ]; then
        ln -sf "$skill_dir" "$target"
        ((updated++)) || true
      else
        ((skipped++)) || true
      fi
    fi
  done

  REGISTER_SKILL_INSTALLED=$installed
  REGISTER_SKILL_UPDATED=$updated
  REGISTER_SKILL_SKIPPED=$skipped
  REGISTER_SKILL_PROFILE_SKIPPED=$profile_skipped
}

register_agents() {
  local source_dir="$1"
  local target_dir="$2"
  local installed=0 updated=0 skipped=0

  mkdir -p "$target_dir"
  [ -d "$source_dir" ] || return 0

  for agent_file in "$source_dir"/*.md; do
    [ -f "$agent_file" ] || continue
    local agent_name
    agent_name=$(basename "$agent_file")
    [[ "$agent_name" == "CLAUDE.md" ]] && continue
    local target="$target_dir/$agent_name"

    if [ -L "$target" ]; then rm -f "$target"; fi

    if [ ! -f "$target" ]; then
      cp "$agent_file" "$target"
      ((installed++)) || true
    elif ! diff -q "$agent_file" "$target" > /dev/null 2>&1; then
      cp "$agent_file" "$target"
      ((updated++)) || true
    else
      ((skipped++)) || true
    fi
  done

  REGISTER_AGENT_INSTALLED=$installed
  REGISTER_AGENT_UPDATED=$updated
  REGISTER_AGENT_SKIPPED=$skipped
}
