import { tavily } from "@tavily/core";

const client = tavily({ apiKey: process.env.TAVVILY_API_KEY });

/**
 * Search the web using Tavily and return a concise formatted context string
 * that can be injected into the Gemini prompt.
 *
 * @param {string} query
 * @returns {Promise<{ context: string, sources: Array<{title,url}> }>}
 */
export async function searchWeb(query) {
  try {
    const result = await client.search(query, {
      searchDepth: "basic",
      maxResults: 5,
      includeAnswer: true,
    });

    const sources = (result.results || []).map((r) => ({
      title: r.title,
      url: r.url,
    }));

    // Build a compact context block for the AI
    const snippets = (result.results || [])
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.content?.slice(0, 400) || ""}`)
      .join("\n\n");

    const answer = result.answer ? `Summary: ${result.answer}\n\n` : "";

    const context = `${answer}Web search results for "${query}":\n\n${snippets}`;

    return { context, sources };
  } catch (err) {
    console.error("[Tavily] Search error:", err.message);
    return { context: "", sources: [] };
  }
}
