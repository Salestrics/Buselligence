import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Bot,
  Database,
  FolderKanban,
  Loader2,
  MessageSquare,
  Plus,
  Workflow,
  GraduationCap,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useSession } from "../lib/auth-client";
import { platformApi } from "../lib/platform-api";

const workspaceIcons: Record<string, typeof MessageSquare> = {
  conversations: MessageSquare,
  documents: BookOpen,
  projects: FolderKanban,
  applications: FolderKanban,
  automations: Workflow,
  dataSources: Database,
  agents: Bot,
  knowledgeBase: BookOpen,
};

const workspaceLabels: Record<string, string> = {
  conversations: "Conversations",
  documents: "Documents",
  projects: "Projects",
  applications: "Applications",
  automations: "Automations",
  dataSources: "Data Sources",
  agents: "Agents",
  knowledgeBase: "Knowledge Base",
};

export function WorkspacePage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof platformApi.getWorkspace>> | null>(null);
  const [knowledge, setKnowledge] = useState<Awaited<ReturnType<typeof platformApi.listKnowledge>>>([]);
  const [learnTopic, setLearnTopic] = useState("");
  const [learnLevel, setLearnLevel] = useState("intermediate");
  const [lesson, setLesson] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: "", content: "" });

  useEffect(() => {
    if (!isPending && !session?.user) navigate("/sign-in");
  }, [isPending, session, navigate]);

  useEffect(() => {
    if (!session?.user) return;
    Promise.all([platformApi.getWorkspace(), platformApi.listKnowledge()])
      .then(([ws, k]) => {
        setWorkspace(ws);
        setKnowledge(k);
      })
      .finally(() => setLoading(false));
  }, [session?.user]);

  async function addNote(e: FormEvent) {
    e.preventDefault();
    if (!newNote.title.trim()) return;
    await platformApi.createKnowledge(newNote);
    const k = await platformApi.listKnowledge();
    setKnowledge(k);
    setNewNote({ title: "", content: "" });
  }

  async function startLesson(e: FormEvent) {
    e.preventDefault();
    if (!learnTopic.trim()) return;
    const s = await platformApi.startLearning(learnTopic, learnLevel);
    setLesson(s.content);
  }

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1020]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-200">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-300">
            My Workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Your AI-powered workspace
          </h1>
          <p className="mt-2 text-slate-400">
            Conversations, documents, projects, agents, and knowledge — all in one place.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workspace &&
            Object.entries(workspace.workspace).map(([key, section]) => {
              const Icon = workspaceIcons[key] ?? FolderKanban;
              const label = workspaceLabels[key] ?? key;
              return (
                <Link
                  key={key}
                  to={section.href}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 transition hover:border-brand-500/30"
                >
                  <Icon className="h-5 w-5 text-brand-400" />
                  <p className="mt-3 font-medium text-white">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-brand-200">{section.count}</p>
                </Link>
              );
            })}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <section id="knowledge" className="rounded-2xl border border-white/8 p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-brand-400" />
              <h2 className="text-lg font-semibold text-white">Knowledge Engine</h2>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Your AI memory — documents, notes, research, and business data.
            </p>

            <form onSubmit={addNote} className="mt-4 space-y-2">
              <input
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="Note title"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Content..."
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs text-white hover:bg-brand-400"
              >
                <Plus className="h-3 w-3" /> Add to knowledge base
              </button>
            </form>

            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {knowledge.map((k) => (
                <div key={k.id} className="rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                  <p className="font-medium text-white">{k.title}</p>
                  <p className="text-xs text-slate-500">{k.sourceType}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/8 p-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-brand-400" />
              <h2 className="text-lg font-semibold text-white">AI Learning System</h2>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              AI that teaches — adapts to beginner, intermediate, or expert.
            </p>

            <form onSubmit={startLesson} className="mt-4 space-y-2">
              <input
                value={learnTopic}
                onChange={(e) => setLearnTopic(e.target.value)}
                placeholder='e.g. "Explain physics"'
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <select
                value={learnLevel}
                onChange={(e) => setLearnLevel(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
              <button
                type="submit"
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-400"
              >
                Start learning
              </button>
            </form>

            {lesson && (
              <pre className="mt-4 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white/[0.03] p-4 text-xs text-slate-300">
                {lesson}
              </pre>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
