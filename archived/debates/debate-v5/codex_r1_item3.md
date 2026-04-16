# Codex R1 - Item 3 Verification: docker-compose.qdrant.yml

## Opus Claim (Item 3)
> ### Item 3: `docker-compose.qdrant.yml`
> **状態**: 4.0K、参照 0 件
> **提案**: `git rm`
> **リスク**: 中 — 手動で `docker compose -f` 呼び出している利用者がいる可能性

## Evidence Gathered

### 1. Broad qdrant search (rg "qdrant")
Command run:

```bash
rg -n --ignore-case "qdrant" .
```

Exact matches (grouped by file):

#### ./config/proxy-mcp/hierarchical-memory.json
- ./config/proxy-mcp/hierarchical-memory.json:14:      "backend": "qdrant",
- ./config/proxy-mcp/hierarchical-memory.json:19:      "qdrant": {
- ./config/proxy-mcp/hierarchical-memory.json:20:        "url": "${QDRANT_URL:-http://localhost:6333}",
- ./config/proxy-mcp/hierarchical-memory.json:21:        "collection": "${QDRANT_COLLECTION_NAME:-taisun_memory}",

#### ./debate-v5/codex_r1_item10.md
- ./debate-v5/codex_r1_item10.md:4:Opus Item 10 states that 5 root-level compose files (`docker-compose.{llm,monitoring,ops,qdrant,tools}.yml`) should be moved to `docker/compose/` (source: `debate-v5/opus_initial_positions.md:69-72`).
- ./debate-v5/codex_r1_item10.md:20:docker-compose.qdrant.yml
- ./debate-v5/codex_r1_item10.md:39:- `docker-compose.qdrant.yml` appears only in debate text (`debate-v5/opus_initial_positions.md:26`).
- ./debate-v5/codex_r1_item10.md:51:- `docker-compose.qdrant.yml`: **No** (only debate mention at `debate-v5/opus_initial_positions.md:26`).
- ./debate-v5/codex_r1_item10.md:70:| Qdrant compose references | `debate-v5/opus_initial_positions.md` | `26` | Debate-only reference |

#### ./debate-v5/opus_initial_positions.md
- ./debate-v5/opus_initial_positions.md:26:### Item 3: `docker-compose.qdrant.yml`
- ./debate-v5/opus_initial_positions.md:70:**状態**: docker-compose.{llm,monitoring,ops,qdrant,tools}.yml が root 直下

#### ./debate/round10_agreement.md
- ./debate/round10_agreement.md:11:| 5. QDRANT_URL未設定（Codex新規） | AGREE ✅ | High | memory_addへの影響確認 + .env.exampleに[RECOMMENDED]追加 |
- ./debate/round10_agreement.md:37:### 修正2: .env.example の QDRANT 変数に[RECOMMENDED]追加
- ./debate/round10_agreement.md:39:Round 7 の構造変更と合わせて、QDRANT を `[RECOMMENDED]` セクションへ移動:
- ./debate/round10_agreement.md:46:# Qdrant (memory_add / memory_search ツールで使用)
- ./debate/round10_agreement.md:48:QDRANT_URL=http://localhost:6333
- ./debate/round10_agreement.md:49:QDRANT_COLLECTION_NAME=taisun_memory
- ./debate/round10_agreement.md:66:| memory_add の Qdrant 未起動時挙動 | `src/proxy-mcp/tools/memory.ts` の接続エラー処理確認 | 次ラウンドまたは別issueで対応 |
- ./debate/round10_agreement.md:77:- QDRANT_URL が[RECOMMENDED]に含まれていない（memory系ツールへの影響）

#### ./debate/round6_agreement.md
- ./debate/round6_agreement.md:14:- `grounding.ts:retrieveSnippets` は Qdrant 等の外部ベクターDBを必要とせず、`retriever.ts` の `retrieveTexts()` を呼ぶだけで機能する

#### ./debate/rounds2-6_summary.md
- ./debate/rounds2-6_summary.md:74:`src/rag/retriever.ts`（98行）と `src/rag/indexer.ts`（142行）が実装済みであることを Round 6 中に発見。`grounding.ts:retrieveSnippets` は Qdrant 等の外部ベクターDBを必要とせず、`retrieveTexts()` を呼ぶ5行の変更で機能する。これは「スタブ」ではなく「接続漏れ」。

#### ./debate/rounds7-11_summary.md
- ./debate/rounds7-11_summary.md:28:- RECOMMENDED: `TAVILY_API_KEY`, `BRAVE_SEARCH_API_KEY`, `GITHUB_TOKEN`, `QDRANT_URL`（Round 10で追加）
- ./debate/rounds7-11_summary.md:86:| QDRANT_URL 未設定（Codex 新規発見） | memory_add への影響確認が必要、[RECOMMENDED] に追加 |
- ./debate/rounds7-11_summary.md:95:- `.env.example`: `QDRANT_URL` を `[RECOMMENDED]` セクションに移動 + 注記追加
- ./debate/rounds7-11_summary.md:143:| `src/proxy-mcp/tools/memory.ts` の Qdrant 未起動時挙動 | 接続エラー処理確認 |

#### ./docker-compose.qdrant.yml
- ./docker-compose.qdrant.yml:4:  qdrant:
- ./docker-compose.qdrant.yml:5:    image: qdrant/qdrant:latest
- ./docker-compose.qdrant.yml:6:    container_name: taisun-qdrant
- ./docker-compose.qdrant.yml:12:      QDRANT_API_KEY: ${QDRANT_API_KEY:-}
- ./docker-compose.qdrant.yml:14:      QDRANT_STORAGE__MEMMAP_THRESHOLD_MB: 100
- ./docker-compose.qdrant.yml:15:      QDRANT_STORAGE__HNSW__MAX_INDEXING_THREADS: 4
- ./docker-compose.qdrant.yml:17:      QDRANT_STORAGE__SNAPSHOTS_PATH: ./data/snapshots
- ./docker-compose.qdrant.yml:19:      - ./data/qdrant:/qdrant/storage
- ./docker-compose.qdrant.yml:20:      - ./config/qdrant.yaml:/qdrant/config/qdrant.yaml:ro

#### ./docs/API_KEY_TROUBLESHOOTING.md
- ./docs/API_KEY_TROUBLESHOOTING.md:176:export QDRANT_URL="http://localhost:6333"
- ./docs/API_KEY_TROUBLESHOOTING.md:177:export QDRANT_COLLECTION_NAME="taisun_memory"

#### ./docs/PROJECT_MCP_RECOMMENDATIONS.md
- ./docs/PROJECT_MCP_RECOMMENDATIONS.md:24:| `qdrant` | ローカルベクトル検索 | 低 |
- ./docs/PROJECT_MCP_RECOMMENDATIONS.md:53:    "qdrant": { "disabled": true },
- ./docs/PROJECT_MCP_RECOMMENDATIONS.md:88:    "qdrant": { "disabled": true },
- ./docs/PROJECT_MCP_RECOMMENDATIONS.md:121:    "qdrant": { "disabled": true },
- ./docs/PROJECT_MCP_RECOMMENDATIONS.md:156:    "qdrant": { "disabled": false },
- ./docs/PROJECT_MCP_RECOMMENDATIONS.md:195:    "qdrant": { "disabled": true },

#### ./docs/SYSTEM_ENHANCEMENT_PLAN.md
- ./docs/SYSTEM_ENHANCEMENT_PLAN.md:52:    "qdrant": {
- ./docs/SYSTEM_ENHANCEMENT_PLAN.md:94:→ Skip: figma, qdrant, n8n-mcp (不要)

#### ./docs/proposal-v2-final-cost-optimized-model-routing.md
- ./docs/proposal-v2-final-cost-optimized-model-routing.md:20:| ベクトルDB | Qdrant | **Redis（Qdrantは非推奨）** | Qdrantは埋め込み次元1536ハードコード問題あり |
- ./docs/proposal-v2-final-cost-optimized-model-routing.md:291:### 5.2 Qdrant Semantic Cache の問題（重要）
- ./docs/proposal-v2-final-cost-optimized-model-routing.md:293:LiteLLMのQdrant Semantic Cacheには**致命的な制限**がある:
- ./docs/proposal-v2-final-cost-optimized-model-routing.md:294:- ベクトル次元が`QDRANT_VECTOR_SIZE = 1536`に**ハードコード**されている
- ./docs/proposal-v2-final-cost-optimized-model-routing.md:325:### 5.4 代替: Qdrant + OpenAI Embedding
- ./docs/proposal-v2-final-cost-optimized-model-routing.md:339:    type: qdrant-semantic
- ./docs/proposal-v2-final-cost-optimized-model-routing.md:340:    qdrant_semantic_cache_embedding_model: openai-embedding
- ./docs/proposal-v2-final-cost-optimized-model-routing.md:341:    qdrant_collection_name: litellm_cache
- ./docs/proposal-v2-final-cost-optimized-model-routing.md:626:| Qdrant埋め込み次元問題 | キャッシュ使用不可 | 確実 | Redis Semantic Cache使用で回避 |
- ./docs/proposal-v2-final-cost-optimized-model-routing.md:660:- [LiteLLM Issue #6262 - Qdrant Embedding Dimension](https://github.com/BerriAI/litellm/issues/6262)

#### ./docs/research-knowledge-scaling/research-agent-a7f003bf.md
- ./docs/research-knowledge-scaling/research-agent-a7f003bf.md:10:{"parentUuid":"7e0e8d1e-636f-46ab-9cc7-c65154c12fc7","isSidechain":true,"promptId":"1126bf16-b3b9-40a6-b345-570410812971","agentId":"a7f003bf653d93278","type":"user","message":{"role":"user","content":[{"tool_use_id":"toolu_01V6gE65QyUREJRQfxQYm4zn","type":"tool_result","content":"Web search results for query: \"\"Claude Code\" memory scaling large files site:news.ycombinator.com\"\n\nLinks: [{\"title\":\"I built a memory system for Claude that solves the context loss issue | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=45546037\"},{\"title\":\"Show HN: I built simple and efficient local memory system for Claude Code | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=46858166\"},{\"title\":\"Show HN: We added memory to Claude Code. It's powerful now | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=46827133\"},{\"title\":\"Show HN: Total Recall – write-gated memory for Claude Code | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=46907183\"},{\"title\":\"Show HN: Oubli – Persistent fractal memory for Claude Code | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=46598743\"},{\"title\":\"Gave my Claude a subconscious memory system | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=47670002\"},{\"title\":\"Show HN: Fixing Claude Code's amnesia with persistent memory | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=47593178\"},{\"title\":\"Show HN: Stop Claude Code from forgetting everything | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=46426624\"},{\"title\":\"Show HN: CMV – Virtual memory for Claude Code sessions | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=47074246\"},{\"title\":\"Show HN: Persistent memory for Claude Code sessions | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=46126066\"}]\n\nI found several relevant results from Hacker News about Claude Code memory systems and how they handle scaling with large files:\n\nSome early memory systems for Claude Code consumed a lot of RAM and made Claude sessions resource-intensive. In response, developers created various solutions:\n\nOne approach uses a dual-layer architecture with SQLite and Qdrant vector search, along with Git-style versioning and memory access patterns that include importance decay and usage tracking.\n\nAnother simpler approach saves sessions into Markdown files that can be viewed later.\n\nHowever, scaling has been a concern. One developer noted that at scale, doing N relevance checks per tool call raises questions about whether there's a scaling limit or if caching keeps it manageable. Additionally, with automatic memory systems, once notes get long enough, only the top N lines are read, and older notes silently disappear from context regardless of importance.\n\nSome newer solutions address this differently—one approach uses a \"write gate\" that only saves information if it will change future behavior, asking before anything gets promoted to memory.\n\n\nREMINDER: You MUST include the sources above in your response to the user using markdown hyperlinks."}]},"uuid":"8ed258c3-07d8-4ad0-8a0c-64e9f1b8e41e","timestamp":"2026-04-12T01:40:19.112Z","sourceToolAssistantUUID":"7e0e8d1e-636f-46ab-9cc7-c65154c12fc7","userType":"external","entrypoint":"cli","cwd":"/Users/matsumototoshihiko/taisun_agent","sessionId":"192b8c37-d9f0-4c7b-9316-a2a7b753f4a4","version":"2.1.96","gitBranch":"main","slug":"wondrous-stirring-pearl"}

#### ./mcp-presets/development.mcp.json
- ./mcp-presets/development.mcp.json:27:    "qdrant": {
- ./mcp-presets/development.mcp.json:30:      "args": ["mcp-server-qdrant"],
- ./mcp-presets/development.mcp.json:32:        "QDRANT_URL": "${QDRANT_URL:-http://localhost:6333}",
- ./mcp-presets/development.mcp.json:33:        "COLLECTION_NAME": "${QDRANT_COLLECTION_NAME:-taisun_memory}",

#### ./mcp-presets/full-optimized.mcp.json
- ./mcp-presets/full-optimized.mcp.json:80:    "qdrant": {
- ./mcp-presets/full-optimized.mcp.json:83:      "args": ["mcp-server-qdrant"],
- ./mcp-presets/full-optimized.mcp.json:85:        "QDRANT_URL": "${QDRANT_URL:-http://localhost:6333}",
- ./mcp-presets/full-optimized.mcp.json:86:        "COLLECTION_NAME": "${QDRANT_COLLECTION_NAME:-taisun_memory}",

#### ./scripts/optimize-skills.py
- ./scripts/optimize-skills.py:74:    "qdrant-memory": "Vector search and long-term memory",

#### ./scripts/skill-profiles.json
- ./scripts/skill-profiles.json:34:        "hierarchical-memory", "qdrant-memory", "notion-knowledge-mcp",

#### ./scripts/switch-mcp.sh
- ./scripts/switch-mcp.sh:110:    "qdrant": {
- ./scripts/switch-mcp.sh:113:      "args": ["mcp-server-qdrant"],
- ./scripts/switch-mcp.sh:115:        "QDRANT_URL": "${QDRANT_URL:-http://localhost:6333}",
- ./scripts/switch-mcp.sh:116:        "COLLECTION_NAME": "${QDRANT_COLLECTION_NAME:-taisun_memory}",
- ./scripts/switch-mcp.sh:120:      "description": "Qdrant MCP - ベクトル検索",

### 2. Makefile references
Commands run:

```bash
find . -type f \( -name 'Makefile' -o -name 'makefile' -o -name '*.mk' \) | sort
find . -type f \( -name 'Makefile' -o -name 'makefile' -o -name '*.mk' \) -print0 | xargs -0 rg -n --ignore-case "qdrant"
```

Makefiles scanned:
- `./Makefile`
- `./mcp-servers/voice-ai-mcp-server/node_modules/debug/Makefile`
- `./mcp-servers/voice-ai-mcp-server/node_modules/delayed-stream/Makefile`
- `./node_modules/delayed-stream/Makefile`
- `./node_modules/lunr/Makefile`

qdrant matches: none found.

### 3. CI references
Commands run:

```bash
find . -type f \( -path './.github/workflows/*' -o -name '.gitlab-ci.yml' -o -path './.circleci/*' -o -name 'Jenkinsfile' -o -name 'azure-pipelines.yml' -o -name 'azure-pipelines.yaml' \) | sort
```

CI files scanned:
- `./.github/workflows/auto-log.yml`
- `./.github/workflows/cd.yml`
- `./.github/workflows/ci.yml`
- `./.github/workflows/integration.yml`
- `./.github/workflows/security.yml`

qdrant matches in CI files: none found (`rg -n --ignore-case "qdrant"` over the CI file list produced no output).

### 4. Docs / README references
Commands run:

```bash
rg -n --ignore-case "qdrant" docs README.md
rg -n --ignore-case "qdrant" README.md
```

Docs matches:

#### docs/API_KEY_TROUBLESHOOTING.md
- docs/API_KEY_TROUBLESHOOTING.md:176:export QDRANT_URL="http://localhost:6333"
- docs/API_KEY_TROUBLESHOOTING.md:177:export QDRANT_COLLECTION_NAME="taisun_memory"

#### docs/PROJECT_MCP_RECOMMENDATIONS.md
- docs/PROJECT_MCP_RECOMMENDATIONS.md:24:| `qdrant` | ローカルベクトル検索 | 低 |
- docs/PROJECT_MCP_RECOMMENDATIONS.md:53:    "qdrant": { "disabled": true },
- docs/PROJECT_MCP_RECOMMENDATIONS.md:88:    "qdrant": { "disabled": true },
- docs/PROJECT_MCP_RECOMMENDATIONS.md:121:    "qdrant": { "disabled": true },
- docs/PROJECT_MCP_RECOMMENDATIONS.md:156:    "qdrant": { "disabled": false },
- docs/PROJECT_MCP_RECOMMENDATIONS.md:195:    "qdrant": { "disabled": true },

#### docs/SYSTEM_ENHANCEMENT_PLAN.md
- docs/SYSTEM_ENHANCEMENT_PLAN.md:52:    "qdrant": {
- docs/SYSTEM_ENHANCEMENT_PLAN.md:94:→ Skip: figma, qdrant, n8n-mcp (不要)

#### docs/proposal-v2-final-cost-optimized-model-routing.md
- docs/proposal-v2-final-cost-optimized-model-routing.md:20:| ベクトルDB | Qdrant | **Redis（Qdrantは非推奨）** | Qdrantは埋め込み次元1536ハードコード問題あり |
- docs/proposal-v2-final-cost-optimized-model-routing.md:291:### 5.2 Qdrant Semantic Cache の問題（重要）
- docs/proposal-v2-final-cost-optimized-model-routing.md:293:LiteLLMのQdrant Semantic Cacheには**致命的な制限**がある:
- docs/proposal-v2-final-cost-optimized-model-routing.md:294:- ベクトル次元が`QDRANT_VECTOR_SIZE = 1536`に**ハードコード**されている
- docs/proposal-v2-final-cost-optimized-model-routing.md:325:### 5.4 代替: Qdrant + OpenAI Embedding
- docs/proposal-v2-final-cost-optimized-model-routing.md:339:    type: qdrant-semantic
- docs/proposal-v2-final-cost-optimized-model-routing.md:340:    qdrant_semantic_cache_embedding_model: openai-embedding
- docs/proposal-v2-final-cost-optimized-model-routing.md:341:    qdrant_collection_name: litellm_cache
- docs/proposal-v2-final-cost-optimized-model-routing.md:626:| Qdrant埋め込み次元問題 | キャッシュ使用不可 | 確実 | Redis Semantic Cache使用で回避 |
- docs/proposal-v2-final-cost-optimized-model-routing.md:660:- [LiteLLM Issue #6262 - Qdrant Embedding Dimension](https://github.com/BerriAI/litellm/issues/6262)

#### docs/research-knowledge-scaling/research-agent-a7f003bf.md
- docs/research-knowledge-scaling/research-agent-a7f003bf.md:10:{"parentUuid":"7e0e8d1e-636f-46ab-9cc7-c65154c12fc7","isSidechain":true,"promptId":"1126bf16-b3b9-40a6-b345-570410812971","agentId":"a7f003bf653d93278","type":"user","message":{"role":"user","content":[{"tool_use_id":"toolu_01V6gE65QyUREJRQfxQYm4zn","type":"tool_result","content":"Web search results for query: \"\"Claude Code\" memory scaling large files site:news.ycombinator.com\"\n\nLinks: [{\"title\":\"I built a memory system for Claude that solves the context loss issue | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=45546037\"},{\"title\":\"Show HN: I built simple and efficient local memory system for Claude Code | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=46858166\"},{\"title\":\"Show HN: We added memory to Claude Code. It's powerful now | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=46827133\"},{\"title\":\"Show HN: Total Recall – write-gated memory for Claude Code | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=46907183\"},{\"title\":\"Show HN: Oubli – Persistent fractal memory for Claude Code | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=46598743\"},{\"title\":\"Gave my Claude a subconscious memory system | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=47670002\"},{\"title\":\"Show HN: Fixing Claude Code's amnesia with persistent memory | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=47593178\"},{\"title\":\"Show HN: Stop Claude Code from forgetting everything | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=46426624\"},{\"title\":\"Show HN: CMV – Virtual memory for Claude Code sessions | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=47074246\"},{\"title\":\"Show HN: Persistent memory for Claude Code sessions | Hacker News\",\"url\":\"https://news.ycombinator.com/item?id=46126066\"}]\n\nI found several relevant results from Hacker News about Claude Code memory systems and how they handle scaling with large files:\n\nSome early memory systems for Claude Code consumed a lot of RAM and made Claude sessions resource-intensive. In response, developers created various solutions:\n\nOne approach uses a dual-layer architecture with SQLite and Qdrant vector search, along with Git-style versioning and memory access patterns that include importance decay and usage tracking.\n\nAnother simpler approach saves sessions into Markdown files that can be viewed later.\n\nHowever, scaling has been a concern. One developer noted that at scale, doing N relevance checks per tool call raises questions about whether there's a scaling limit or if caching keeps it manageable. Additionally, with automatic memory systems, once notes get long enough, only the top N lines are read, and older notes silently disappear from context regardless of importance.\n\nSome newer solutions address this differently—one approach uses a \"write gate\" that only saves information if it will change future behavior, asking before anything gets promoted to memory.\n\n\nREMINDER: You MUST include the sources above in your response to the user using markdown hyperlinks."}]},"uuid":"8ed258c3-07d8-4ad0-8a0c-64e9f1b8e41e","timestamp":"2026-04-12T01:40:19.112Z","sourceToolAssistantUUID":"7e0e8d1e-636f-46ab-9cc7-c65154c12fc7","userType":"external","entrypoint":"cli","cwd":"/Users/matsumototoshihiko/taisun_agent","sessionId":"192b8c37-d9f0-4c7b-9316-a2a7b753f4a4","version":"2.1.96","gitBranch":"main","slug":"wondrous-stirring-pearl"}

README.md matches:
- none found.

### 5. docker-compose.qdrant.yml itself
Existence checks:

```bash
find . -type f -name 'docker-compose.qdrant.yml' | sort
ls -l docker-compose.qdrant.yml
```

Results:
- Found at: `./docker-compose.qdrant.yml`
- Current size: `864` bytes (`ls -l`)

Content summary (`nl -ba docker-compose.qdrant.yml`):
- Defines one service `qdrant` (`docker-compose.qdrant.yml:4`)
- Uses image `qdrant/qdrant:latest` (`docker-compose.qdrant.yml:5`)
- Container name `taisun-qdrant` (`docker-compose.qdrant.yml:6`)
- Exposes ports `6333` and `6334` (`docker-compose.qdrant.yml:8-9`)
- Sets Qdrant environment variables (`docker-compose.qdrant.yml:12,14,15,17`)
- Mounts data/config volumes (`docker-compose.qdrant.yml:19-20`)
- Includes healthcheck and restart policy (`docker-compose.qdrant.yml:21-26`)

Direct references to `docker-compose.qdrant.yml` from other files (separate from generic "qdrant" mentions):
- `./debate-v5/opus_initial_positions.md:26`
- `./debate-v5/codex_r1_item10.md:20`
- `./debate-v5/codex_r1_item10.md:39`
- `./debate-v5/codex_r1_item10.md:51`

No Makefile/CI/docs/README operational command references to `docker-compose.qdrant.yml` were found.

## Verdict
PARTIALLY AGREE. The repository contains no operational wiring to `docker-compose.qdrant.yml` in Makefiles, CI files, docs runbooks, or `README.md`, so from an automation/runtime perspective it appears orphaned/dead. However, the strict claim "参照 0 件" is not literally true in the current repo snapshot: there are debate-text references to this filename (`debate-v5/opus_initial_positions.md` and `debate-v5/codex_r1_item10.md`). Also, the file is currently 864 bytes, not 4.0K by `ls -l`.

## Confidence
HIGH — verdict is based on a repo-wide `rg -n --ignore-case "qdrant"` sweep plus targeted Makefile, CI, docs, README, and direct filename reference checks.
