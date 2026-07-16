export interface GenesisBlueprint {
  name: string;
  tagline: string;
  architecture: string[];
  modules: string[];
  stack: string[];
}

export interface GenesisBuild {
  id: string;
  prompt: string;
  projectName: string;
  status: "pending" | "building" | "completed" | "failed";
  progress: number;
  currentAgent?: string;
  currentFile?: string;
  blueprint: GenesisBlueprint;
  roadmap: {
    sprints: Array<{
      number: number;
      name: string;
      tasks: string[];
      status: string;
    }>;
  };
  stats: { filesCreated: number; testsPassing: number; aiDecisions: number };
  studioProjectId?: string;
  preview: {
    title: string;
    navigation: Array<{ label: string; children?: string[] }>;
  };
  events: BuildEvent[];
}

export interface BuildEvent {
  type: string;
  agent?: string;
  agentEmoji?: string;
  message: string;
  file?: string;
  progress?: number;
  timestamp: string;
}

async function genesisFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const genesisApi = {
  getInfo: () =>
    genesisFetch<{ name: string; tagline: string; subtitle: string; engine: string }>("/api/genesis"),

  startBuild: (prompt: string) =>
    genesisFetch<{ build: GenesisBuild }>("/api/genesis/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }).then((r) => r.build),

  getBuild: (id: string) =>
    genesisFetch<{ build: GenesisBuild }>(`/api/genesis/builds/${id}`).then((r) => r.build),

  listBuilds: () =>
    genesisFetch<{ builds: GenesisBuild[] }>("/api/genesis/builds").then((r) => r.builds),

  streamBuild(
    buildId: string,
    onEvent: (event: BuildEvent & { build?: GenesisBuild }) => void,
    onDone: () => void,
    onError: (err: Error) => void
  ): () => void {
    const source = new EventSource(`/api/genesis/builds/${buildId}/stream`, {
      withCredentials: true,
    });

    source.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as BuildEvent & { build?: GenesisBuild };
        onEvent(data);
        if (data.type === "complete" || data.type === "build") {
          source.close();
          onDone();
        }
        if (data.type === "error") {
          source.close();
          onError(new Error(data.message));
        }
      } catch {
        // ignore parse errors
      }
    };

    source.onerror = () => {
      source.close();
      onError(new Error("Build stream disconnected"));
    };

    return () => source.close();
  },
};
