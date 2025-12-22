#!/bin/bash
#
# MCP Health Check Script
# Checks the status of all configured MCP servers
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MCP_CONFIG="$PROJECT_ROOT/.mcp.json"

echo "=========================================="
echo "  MCP Server Health Check"
echo "=========================================="
echo ""

# Check if .mcp.json exists
if [ ! -f "$MCP_CONFIG" ]; then
    echo -e "${RED}Error: .mcp.json not found at $MCP_CONFIG${NC}"
    exit 1
fi

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Function to check environment variable
check_env_var() {
    local var_name=$1
    local value="${!var_name}"

    if [ -z "$value" ] || [[ "$value" == *"your_"* ]] || [[ "$value" == *"xxxx"* ]]; then
        echo -e "${YELLOW}  ! ENV: $var_name not configured${NC}"
        return 1
    else
        echo -e "${GREEN}  ✓ ENV: $var_name configured${NC}"
        return 0
    fi
}

# Function to check if npx package exists
check_npx_package() {
    local package=$1
    if npx --yes "$package" --version >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

echo "Checking MCP Servers..."
echo ""

# Parse MCP config and check each server
SERVERS=$(jq -r '.mcpServers | keys[]' "$MCP_CONFIG" 2>/dev/null)

TOTAL=0
READY=0
MISSING_CONFIG=0

for SERVER in $SERVERS; do
    TOTAL=$((TOTAL + 1))

    TYPE=$(jq -r ".mcpServers[\"$SERVER\"].type" "$MCP_CONFIG")
    DESCRIPTION=$(jq -r ".mcpServers[\"$SERVER\"].description" "$MCP_CONFIG")
    CATEGORY=$(jq -r ".mcpServers[\"$SERVER\"].category // \"general\"" "$MCP_CONFIG")

    echo -e "[$CATEGORY] ${GREEN}$SERVER${NC}"
    echo "  Description: $DESCRIPTION"
    echo "  Type: $TYPE"

    SERVER_READY=true

    case $SERVER in
        "notion")
            if ! check_env_var "NOTION_API_KEY"; then
                SERVER_READY=false
            fi
            ;;
        "postgres-ro"|"postgres-rw")
            if [ "$SERVER" = "postgres-ro" ]; then
                if ! check_env_var "POSTGRES_MCP_DSN"; then
                    SERVER_READY=false
                fi
            else
                if ! check_env_var "POSTGRES_MCP_DSN_RW"; then
                    SERVER_READY=false
                fi
            fi
            ;;
        "github")
            if ! check_env_var "GITHUB_TOKEN"; then
                SERVER_READY=false
            fi
            ;;
        "slack")
            if ! check_env_var "SLACK_BOT_TOKEN"; then
                SERVER_READY=false
            fi
            if ! check_env_var "SLACK_TEAM_ID"; then
                SERVER_READY=false
            fi
            ;;
        "brave-search")
            if ! check_env_var "BRAVE_API_KEY"; then
                SERVER_READY=false
            fi
            ;;
        "docker")
            if docker info >/dev/null 2>&1; then
                echo -e "${GREEN}  ✓ Docker daemon running${NC}"
            else
                echo -e "${RED}  ✗ Docker daemon not running${NC}"
                SERVER_READY=false
            fi
            ;;
        "filesystem"|"memory"|"sequential-thinking")
            echo -e "${GREEN}  ✓ No external dependencies${NC}"
            ;;
    esac

    if $SERVER_READY; then
        echo -e "  Status: ${GREEN}READY${NC}"
        READY=$((READY + 1))
    else
        echo -e "  Status: ${YELLOW}MISSING CONFIG${NC}"
        MISSING_CONFIG=$((MISSING_CONFIG + 1))
    fi

    echo ""
done

echo "=========================================="
echo "  Summary"
echo "=========================================="
echo -e "  Total Servers:    $TOTAL"
echo -e "  ${GREEN}Ready:            $READY${NC}"
echo -e "  ${YELLOW}Missing Config:   $MISSING_CONFIG${NC}"
echo ""

if [ $MISSING_CONFIG -gt 0 ]; then
    echo -e "${YELLOW}Some MCP servers need configuration.${NC}"
    echo "See .env.example for required environment variables."
    exit 0
else
    echo -e "${GREEN}All MCP servers are configured!${NC}"
    exit 0
fi
