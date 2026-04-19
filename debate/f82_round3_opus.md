# F8.2 Round 3: セキュリティ — Opus Analysis

観点: requires.env の記述が security surface を広げないか、API key 漏洩リスク

## Finding 3-1
**Issue**: `requires.env: [ANTHROPIC_API_KEY, OPENAI_API_KEY, ...]` は "このスキルはこの env を読む" を明示する。悪意ある SKILL.md が `requires.env: [GITHUB_TOKEN, AWS_SECRET_ACCESS_KEY]` を宣言して Claude Code 経由で env 値を読み出す攻撃ベクターを作りかねない。Trust Model が不明確。
**Evidence**: docs/SKILL_REQUIRES_SCHEMA.md requires.env 仕様
**Category**: security
**Severity**: high
**Proposed fix**: docs/SKILL_REQUIRES_SCHEMA.md の Security セクションを追加: "requires.env は *必要な* env 変数の *宣言* であり、Claude Code は自動的にそれを渡さない。値は skill 側で `process.env.XXX` で明示的に読む。"
また validator で `GITHUB_TOKEN` `AWS_*` `GCP_*` `AZURE_*` 等のプラットフォーム埋め込み系の env を記述する場合、警告を出す。

## Finding 3-2
**Issue**: research-system/SKILL.md は 17個の env を要求 (`ANTHROPIC_API_KEY,OPENROUTER_API_KEY,XAI_API_KEY,TAVILY_API_KEY,SERPAPI_KEY,BRAVE_SEARCH_API_KEY,BRAVE_API_KEY,NEWSAPI_KEY,PERPLEXITY_API_KEY,EXA_API_KEY,ALPHA_VANTAGE_API_KEY,FRED_API_KEY,APIFY_TOKEN,GROQ_API_KEY,FIRECRAWL_API_KEY,X_BEARER_TOKEN,TWITTER_AUTH_TOKEN`)。これ全部が**実際に必要**か、一部は**フォールバック候補**か不明。required vs optional の区別が schema にない。
**Evidence**: scan 結果 research-system の env 列挙 / docs/SKILL_REQUIRES_SCHEMA.md は env を string[] のみ定義
**Category**: architecture
**Severity**: medium
**Proposed fix**: requires.env を拡張して `{name, required}` object 配列も許可する：
```yaml
requires:
  env:
    - ANTHROPIC_API_KEY       # string = required
    - name: SERPAPI_KEY
      required: false         # object = optional fallback
```
または Phase 1 では string[] のみ（全部 required 扱い）とし、実際の required/optional 区別は実装時に各スキルで確認して記入。研究系スキルは fallback が多いので、本当に required な 1-2 個のみ記入。

## Finding 3-3
**Issue**: `scripts/check-skill-requirements.js` の `extractFrontmatter()` 正規表現 `^---\r?\n([\s\S]*?)\r?\n---` は、悪意ある SKILL.md で `---` を本文内に仕込んだ ReDoS 可能性がある（`[\s\S]*?` lazy match）。実際の risk は低いが CI で走るため検証したい。
**Evidence**: scripts/check-skill-requirements.js extractFrontmatter L63
**Category**: security
**Severity**: low
**Proposed fix**: 正規表現を `^---\r?\n([\s\S]+?)\r?\n---$` (anchor 化) + `m` flag で簡潔化、またはラインベース parse に変更。
