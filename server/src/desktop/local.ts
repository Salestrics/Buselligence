export interface LocalRuntimeConfig {
  offlineMode: boolean;
  providers: Array<{ name: string; url?: string; status: string }>;
  embeddings: { local: boolean; model: string };
  vectorDb: { local: boolean; engine: string };
}

export function getLocalRuntimeConfig(): LocalRuntimeConfig {
  const hasOllama = Boolean(process.env.OLLAMA_BASE_URL);
  return {
    offlineMode: process.env.DESKTOP_OFFLINE === "true",
    providers: [
      { name: "Ollama", url: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434", status: hasOllama ? "connected" : "available" },
      { name: "llama.cpp", status: "available" },
      { name: "Local Models", status: "available" },
    ],
    embeddings: { local: true, model: process.env.LOCAL_EMBEDDING_MODEL ?? "nomic-embed-text" },
    vectorDb: { local: true, engine: "sqlite-vec" },
  };
}

export const DESKTOP_TAGLINE = "Your AI development environment in one click.";
export const DESKTOP_HEADLINE = "Buselligence is an AI computer for developers.";
