export interface LocalFirstConfig {
  enabled: boolean;
  models: {
    local: boolean;
    providers: string[];
    defaultLocalModel?: string;
  };
  embeddings: {
    local: boolean;
    provider: string;
    model: string;
  };
  vectorDb: {
    local: boolean;
    engine: string;
    path?: string;
  };
  offline: {
    supported: boolean;
    mode: "full" | "partial" | "disabled";
    notes: string[];
  };
}

export function getLocalFirstConfig(): LocalFirstConfig {
  const hasOllama = Boolean(process.env.OLLAMA_BASE_URL ?? process.env.LOCAL_MODEL_URL);
  const offlineMode = process.env.KERNEL_OFFLINE === "true";

  return {
    enabled: true,
    models: {
      local: hasOllama || true,
      providers: ["ollama", "llama.cpp", "vllm", "openai-compatible"],
      defaultLocalModel: process.env.LOCAL_MODEL ?? "llama3.2",
    },
    embeddings: {
      local: true,
      provider: "local",
      model: process.env.LOCAL_EMBEDDING_MODEL ?? "nomic-embed-text",
    },
    vectorDb: {
      local: true,
      engine: process.env.VECTOR_DB ?? "sqlite-vec",
      path: process.env.VECTOR_DB_PATH ?? "./data/vectors",
    },
    offline: {
      supported: true,
      mode: offlineMode ? "full" : "partial",
      notes: [
        "Local models via Ollama or OpenAI-compatible endpoints",
        "Embeddings run locally with nomic-embed-text or similar",
        "Vector search uses local SQLite-backed storage",
        "Set KERNEL_OFFLINE=true for fully offline development",
      ],
    },
  };
}

export const LOCAL_FIRST_MESSAGE = "Your AI can run anywhere.";
