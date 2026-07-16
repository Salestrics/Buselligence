import type { SearchProviderId, SearchResult } from "./types.js";

export interface SearchAdapter {
  id: SearchProviderId;
  search(query: string, apiKey: string, maxResults?: number): Promise<SearchResult[]>;
}

export const tavilyAdapter: SearchAdapter = {
  id: "tavily",

  async search(query, apiKey, maxResults = 10) {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        max_results: maxResults,
        include_answer: false,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Tavily search failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      results?: Array<{
        title?: string;
        url?: string;
        content?: string;
        published_date?: string;
      }>;
    };

    return (data.results ?? []).map((result) => ({
      title: result.title ?? "Untitled",
      url: result.url ?? "",
      snippet: result.content ?? "",
      publishedDate: result.published_date,
    }));
  },
};

export const serperAdapter: SearchAdapter = {
  id: "serper",

  async search(query, apiKey, maxResults = 10) {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ q: query, num: maxResults }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Serper search failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      organic?: Array<{
        title?: string;
        link?: string;
        snippet?: string;
        date?: string;
      }>;
    };

    return (data.organic ?? []).map((result) => ({
      title: result.title ?? "Untitled",
      url: result.link ?? "",
      snippet: result.snippet ?? "",
      publishedDate: result.date,
    }));
  },
};

export const braveAdapter: SearchAdapter = {
  id: "brave",

  async search(query, apiKey, maxResults = 10) {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(maxResults));

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Brave search failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      web?: {
        results?: Array<{
          title?: string;
          url?: string;
          description?: string;
          page_age?: string;
        }>;
      };
    };

    return (data.web?.results ?? []).map((result) => ({
      title: result.title ?? "Untitled",
      url: result.url ?? "",
      snippet: result.description ?? "",
      publishedDate: result.page_age,
    }));
  },
};

const adapters: Record<SearchProviderId, SearchAdapter> = {
  tavily: tavilyAdapter,
  serper: serperAdapter,
  brave: braveAdapter,
};

export function getSearchAdapter(provider: SearchProviderId): SearchAdapter {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`Unsupported search provider: ${provider}`);
  }
  return adapter;
}

export async function runWebSearch(
  provider: SearchProviderId,
  apiKey: string,
  query: string,
  maxResults = 10
): Promise<SearchResult[]> {
  const adapter = getSearchAdapter(provider);
  return adapter.search(query, apiKey, maxResults);
}

export async function testSearchConnection(
  provider: SearchProviderId,
  apiKey: string
): Promise<{ ok: boolean; resultCount: number; message?: string }> {
  try {
    const results = await runWebSearch(
      provider,
      apiKey,
      "B2B SaaS companies Series A funding",
      3
    );
    return {
      ok: true,
      resultCount: results.length,
      message: `Connected. Retrieved ${results.length} sample result(s).`,
    };
  } catch (error) {
    return {
      ok: false,
      resultCount: 0,
      message: error instanceof Error ? error.message : "Search test failed",
    };
  }
}
