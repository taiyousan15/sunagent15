/**
 * RAG Grounding module
 * Provides prompt grounding with retrieved context snippets
 */

import { retrieve, RetrieveOptions } from './retriever';

export interface GroundingOptions {
  topK?: number;
  minScore?: number;
}

export interface GroundingResult {
  groundedPrompt: string;
  snippetsUsed: number;
  contextLength: number;
  originalPrompt: string;
}

export interface Snippet {
  content: string;
  score: number;
  source?: string;
}

/**
 * Ground a prompt with relevant context from the knowledge base
 */
export async function groundPrompt(
  prompt: string,
  options: GroundingOptions = {}
): Promise<GroundingResult> {
  const { topK = 3 } = options;

  // Retrieve relevant snippets from in-memory index
  const snippets = retrieveSnippets(prompt, topK);

  if (snippets.length === 0) {
    return {
      groundedPrompt: prompt,
      snippetsUsed: 0,
      contextLength: 0,
      originalPrompt: prompt,
    };
  }

  const contextBlock = snippets
    .map((s, i) => `[Context ${i + 1}]: ${s.content}`)
    .join('\n\n');

  const groundedPrompt = `${contextBlock}\n\n---\n\n${prompt}`;

  return {
    groundedPrompt,
    snippetsUsed: snippets.length,
    contextLength: contextBlock.length,
    originalPrompt: prompt,
  };
}

function retrieveSnippets(
  query: string,
  topK: number
): Snippet[] {
  // retrieve() is synchronous (keyword + tag-based in-memory search from retriever.ts)
  const results = retrieve(query, { topK } as RetrieveOptions);
  return results.map(r => ({
    content: r.doc.body.length > 800
      ? r.doc.body.substring(0, 800) + '\n...[truncated]'
      : r.doc.body,
    score: r.score,
    source: r.doc.id,
  }));
}
