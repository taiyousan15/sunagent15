# TAISUN Agent - Windows Installation Script (PowerShell)
#
# Usage (PowerShell):
#   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
#   .\scripts\install.ps1
#
# Requirements:
#   - Windows 10/11
#   - Node.js v18+ (https://nodejs.org/)
#   - Claude Code (https://claude.ai/download)
#   - PowerShell 5.1 or later

$ErrorActionPreference = "Stop"

$REPO_DIR = Split-Path -Parent $PSScriptRoot
$VERSION = (Get-Content "$REPO_DIR\package.json" | ConvertFrom-Json).version

Write-Host "========================================"
Write-Host "  TAISUN Agent v$VERSION Installation"
Write-Host "  (Windows)"
Write-Host "========================================"
Write-Host ""

# ─────────────────────────────────────────
# Step 1: Prerequisites
# ─────────────────────────────────────────
Write-Host "1. Checking prerequisites..."

# Node.js
try {
    $nodeVersion = (node -v 2>$null).TrimStart('v').Split('.')[0]
    if ([int]$nodeVersion -lt 18) {
        Write-Host "  [WARN] Node.js 18+ recommended (current: $(node -v))"
    } else {
        Write-Host "  [OK] Node.js $(node -v)"
    }
} catch {
    Write-Host "  [ERROR] Node.js is not installed"
    Write-Host "  -> Install from https://nodejs.org/ (v18 or higher)"
    exit 1
}

# npm
try {
    $npmV = npm -v 2>$null
    Write-Host "  [OK] npm $npmV"
} catch {
    Write-Host "  [ERROR] npm is not installed"
    exit 1
}

# uv (optional)
$UV_AVAILABLE = $false
if (Get-Command uv -ErrorAction SilentlyContinue) {
    $UV_AVAILABLE = $true
    Write-Host "  [OK] uv available"
} else {
    Write-Host "  [SKIP] uv not found (optional MCPs disabled)"
    Write-Host "         To install: winget install astral-sh.uv"
}

# Claude Code
if (Get-Command claude -ErrorAction SilentlyContinue) {
    Write-Host "  [OK] Claude Code installed"
} else {
    Write-Host "  [WARN] Claude Code not found"
    Write-Host "         -> Install from https://claude.ai/download"
}

# Python3 (for intelligence-research skill)
if (Get-Command python3 -ErrorAction SilentlyContinue) {
    Write-Host "  [OK] Python3 available (intelligence-research skill enabled)"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "  [OK] Python available (intelligence-research skill enabled)"
} else {
    Write-Host "  [WARN] Python not found (intelligence-research skill path detection may fail)"
    Write-Host "         -> Install from https://www.python.org/"
}

Write-Host ""

# ─────────────────────────────────────────
# Step 2: Install npm dependencies
# ─────────────────────────────────────────
Write-Host "2. Installing npm dependencies..."
Set-Location $REPO_DIR
npm install --silent
Write-Host "  [OK] npm install complete"
Write-Host ""

# ─────────────────────────────────────────
# Step 3: Build MCP servers
# ─────────────────────────────────────────
Write-Host "3. Building MCP servers (dist/)..."

try {
    npm run build 2>$null
    Write-Host "  [OK] Main build complete"
} catch {
    Write-Host "  [WARN] Main build had issues - continuing"
}

foreach ($server in @("voice-ai-mcp-server", "ai-sdr-mcp-server", "line-bot-mcp-server")) {
    $serverPath = "$REPO_DIR\mcp-servers\$server\package.json"
    if (Test-Path $serverPath) {
        try {
            Push-Location "$REPO_DIR\mcp-servers\$server"
            npm install --silent 2>$null
            npm run build 2>$null
            Write-Host "  [OK] $server built"
        } catch {
            Write-Host "  [WARN] $server build failed (API keys may be required)"
        } finally {
            Pop-Location
        }
    }
}

Write-Host ""

# ─────────────────────────────────────────
# Step 4: Install skills (Windows: Junction for dirs)
# ─────────────────────────────────────────
Write-Host "4. Installing skills to ~\.claude\skills\ ..."

$TARGET_SKILLS = "$env:USERPROFILE\.claude\skills"
$SOURCE_SKILLS = "$REPO_DIR\.claude\skills"

if (-not (Test-Path $TARGET_SKILLS)) {
    New-Item -ItemType Directory -Path $TARGET_SKILLS -Force | Out-Null
}

$INSTALLED = 0
$UPDATED = 0
$SKIPPED = 0

if (Test-Path $SOURCE_SKILLS) {
    Get-ChildItem -Path $SOURCE_SKILLS -Directory | ForEach-Object {
        $skillName = $_.Name
        $skillDir = $_.FullName

        # Skip internal dirs
        if ($skillName -in @("_archived", "data")) { return }

        # Must have SKILL.md
        if (-not (Test-Path "$skillDir\SKILL.md")) { return }

        $target = "$TARGET_SKILLS\$skillName"

        # Remove old regular directory (not junction)
        if ((Test-Path $target) -and (-not ((Get-Item $target).Attributes -band [IO.FileAttributes]::ReparsePoint))) {
            Remove-Item $target -Recurse -Force
        }

        if (-not (Test-Path $target)) {
            # Create Junction (no admin rights needed for directories)
            New-Item -ItemType Junction -Path $target -Target $skillDir | Out-Null
            Write-Host "  [+] $skillName"
            $INSTALLED++
        } else {
            $SKIPPED++
        }
    }

    Write-Host ""
    Write-Host "  Skills: $INSTALLED installed, $UPDATED updated, $SKIPPED already linked"
    $total = (Get-ChildItem $TARGET_SKILLS -Directory).Count
    Write-Host "  Total in ~/.claude/skills/: $total"
} else {
    Write-Host "  [ERROR] Skills directory not found: $SOURCE_SKILLS"
}

Write-Host ""

# ─────────────────────────────────────────
# Step 5: Install agents (Windows: Copy files)
# ─────────────────────────────────────────
Write-Host "5. Installing agents to ~\.claude\agents\ ..."

$TARGET_AGENTS = "$env:USERPROFILE\.claude\agents"
$SOURCE_AGENTS = "$REPO_DIR\.claude\agents"

if (-not (Test-Path $TARGET_AGENTS)) {
    New-Item -ItemType Directory -Path $TARGET_AGENTS -Force | Out-Null
}

$AGENT_INSTALLED = 0
$AGENT_SKIPPED = 0

if (Test-Path $SOURCE_AGENTS) {
    Get-ChildItem -Path $SOURCE_AGENTS -Filter "*.md" | ForEach-Object {
        if ($_.Name -eq "CLAUDE.md") { return }

        $target = "$TARGET_AGENTS\$($_.Name)"

        # Always overwrite to keep up to date
        Copy-Item $_.FullName -Destination $target -Force
        $AGENT_INSTALLED++
    }
    $total = (Get-ChildItem $TARGET_AGENTS -Filter "*.md").Count
    Write-Host "  [OK] Agents: $AGENT_INSTALLED installed/updated"
    Write-Host "  Total in ~/.claude/agents/: $total"

    Write-Host "  [NOTE] Windows: agents are copied (not symlinked)."
    Write-Host "         Re-run install.ps1 after 'git pull' to update agents."
}

Write-Host ""

# ─────────────────────────────────────────
# Step 6: Hooks setup (Windows: no chmod needed)
# ─────────────────────────────────────────
Write-Host "6. Setting up directories..."

$dirs = @(
    "$REPO_DIR\.claude\temp",
    "$REPO_DIR\.claude\agent-memory",
    "$REPO_DIR\.taisun\memory"
)
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

Write-Host "  [OK] Directories created"
Write-Host "  [OK] Hooks configured (Windows: chmod not required)"
Write-Host ""

# ─────────────────────────────────────────
# Step 7: .mcp.json setup
# ─────────────────────────────────────────
Write-Host "7. MCP config (.mcp.json) setup..."

if (-not (Test-Path "$REPO_DIR\.mcp.json")) {
    if (Test-Path "$REPO_DIR\.mcp.json.example") {
        Copy-Item "$REPO_DIR\.mcp.json.example" "$REPO_DIR\.mcp.json"
        Write-Host "  [OK] .mcp.json created from template"
    }
} else {
    Write-Host "  [OK] .mcp.json already exists"
}

Write-Host ""

# ─────────────────────────────────────────
# Step 8: .env setup
# ─────────────────────────────────────────
Write-Host "8. Environment variables (.env) setup..."

if (-not (Test-Path "$REPO_DIR\.env")) {
    Write-Host ""
    Write-Host "  .env file not found. Creating from template..."

    if (Test-Path "$REPO_DIR\.env.example") {
        Copy-Item "$REPO_DIR\.env.example" "$REPO_DIR\.env"
    } else {
        New-Item -ItemType File -Path "$REPO_DIR\.env" | Out-Null
    }

    Write-Host ""
    Write-Host "  REQUIRED:"
    Write-Host "  +----------------------------------------------------------+"
    Write-Host "  |  ANTHROPIC_API_KEY=sk-ant-...  (必須)                    |"
    Write-Host "  |  -> https://console.anthropic.com/                        |"
    Write-Host "  +----------------------------------------------------------+"
    Write-Host ""
    Write-Host "  OPTIONAL (intelligence-research skill):"
    Write-Host "  +----------------------------------------------------------+"
    Write-Host "  |  FRED_API_KEY    -> 経済指標 (fred.stlouisfed.org 無料)  |"
    Write-Host "  |  NEWSAPI_KEY     -> ニュース (newsapi.org 無料枠)         |"
    Write-Host "  |  APIFY_TOKEN     -> X/Twitter収集 (apify.com)             |"
    Write-Host "  +----------------------------------------------------------+"
    Write-Host ""
    Write-Host "  -> .env を編集して ANTHROPIC_API_KEY を設定してください"
    Write-Host "     (メモ帳や VSCode で開いて編集)"
} else {
    Write-Host "  [OK] .env already exists"
    $envContent = Get-Content "$REPO_DIR\.env" -Raw
    if ($envContent -match "ANTHROPIC_API_KEY=sk-ant-") {
        Write-Host "  [OK] ANTHROPIC_API_KEY is set"
    } else {
        Write-Host "  [WARN] ANTHROPIC_API_KEY not set in .env"
    }
}

Write-Host ""

# ─────────────────────────────────────────
# Step 9: Verification
# ─────────────────────────────────────────
Write-Host "9. Registering MCPs globally (~/.claude/settings.json)..."

$SETTINGS_FILE = "$env:USERPROFILE\.claude\settings.json"
$settingsDir = Split-Path $SETTINGS_FILE
if (-not (Test-Path $settingsDir)) {
    New-Item -ItemType Directory -Path $settingsDir -Force | Out-Null
}

$nodeScript = @"
const fs = require('fs');
const path = require('path');
const REPO_DIR = '$($REPO_DIR -replace '\\\\', '/')';
const SETTINGS_FILE = '$($SETTINGS_FILE -replace '\\\\', '//')';

let settings = {};
try { settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch(e) {}
if (!settings.mcpServers) settings.mcpServers = {};

let mcp = {};
try { mcp = JSON.parse(fs.readFileSync(path.join(REPO_DIR, '.mcp.json'), 'utf8')); } catch(e) {}

for (const [key, val] of Object.entries(mcp.mcpServers || {})) {
  if (key.startsWith('_comment')) continue;
  const server = JSON.parse(JSON.stringify(val));
  if (Array.isArray(server.args)) {
    server.args = server.args.map(arg => {
      if (typeof arg === 'string' && !path.isAbsolute(arg) &&
          (arg.startsWith('dist/') || arg.startsWith('mcp-servers/'))) {
        return path.join(REPO_DIR, arg).replace(/\//g, '\\\\');
      }
      return arg;
    });
  }
  settings.mcpServers[key] = server;
}

fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
console.log('  [OK] MCPs registered globally (' + Object.keys(settings.mcpServers).filter(k=>!k.startsWith('_')).length + ' servers)');
"@

try {
    node -e $nodeScript
} catch {
    Write-Host "  [WARN] Global MCP registration failed - run Step 2 manually"
}

Write-Host ""

Write-Host "10. Verification..."

if (Test-Path "$REPO_DIR\.claude\CLAUDE.md") {
    Write-Host "  [OK] .claude/CLAUDE.md present"
}

$SKILL_COUNT = (Get-ChildItem $TARGET_SKILLS -Directory -ErrorAction SilentlyContinue).Count
Write-Host "  [OK] Skills available: $SKILL_COUNT"

$AGENT_COUNT = (Get-ChildItem $TARGET_AGENTS -Filter "*.md" -ErrorAction SilentlyContinue).Count
Write-Host "  [OK] Agents available: $AGENT_COUNT"

Write-Host ""
Write-Host "========================================"
Write-Host "  Installation Complete! v$VERSION"
Write-Host "  (Windows)"
Write-Host "========================================"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. .env を編集 -> ANTHROPIC_API_KEY を設定"
Write-Host "  2. Claude Code をこのディレクトリで開く"
Write-Host ""
Write-Host "Update:"
Write-Host "  git pull origin main"
Write-Host "  .\scripts\install.ps1"
Write-Host ""
Write-Host "Note: スキルは Junction リンク (自動更新)、"
Write-Host "      エージェントは Copy (git pull 後に再実行して更新)。"
Write-Host ""
