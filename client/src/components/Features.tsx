import {
  Bot,
  BookOpen,
  Brain,
  Code2,
  Database,
  GraduationCap,
  Hammer,
  LayoutDashboard,
  Network,
  Palette,
  Server,
  Shield,
  Sparkles,
  Store,
  Workflow,
} from "lucide-react";

const capabilities = [
  {
    icon: Sparkles,
    title: "Universal AI Assistant",
    description:
      "Not just chat — a true AI companion. Research, create documents, write code, build apps, automate tasks, and teach concepts.",
  },
  {
    icon: LayoutDashboard,
    title: "AI Workspace",
    description:
      "Conversations, documents, projects, applications, automations, data sources, agents, and your knowledge base — all in one place.",
  },
  {
    icon: Hammer,
    title: "AI App Builder",
    description:
      "Anyone creates software. \"Create an inventory system\" → database, dashboard, reports, permissions, automation. No coding required.",
  },
  {
    icon: Code2,
    title: "Developer Studio",
    description:
      "Monaco editor, terminal, Git, debugging, extensions, and an AI coding agent. A full AI-native IDE for builders.",
  },
  {
    icon: Bot,
    title: "AI Software Engineer",
    description:
      "Everyone gets a technical partner — generate apps, fix bugs, write tests, review security, and deploy software.",
  },
  {
    icon: Database,
    title: "AI Data Intelligence",
    description:
      "Connect databases, spreadsheets, APIs, and business systems. Ask what to focus on — AI analyzes sales, costs, trends, and opportunities.",
  },
  {
    icon: Brain,
    title: "AI Agents",
    description:
      "Specialized workers: Writing Assistant, Study Tutor, Sales Agent, Code Reviewer, DevOps Agent, and more. Create your own.",
  },
  {
    icon: Store,
    title: "Agent Marketplace",
    description:
      "App store for AI workers. Install → customize → use. Community-contributed agents, connectors, and templates.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Engine",
    description:
      "Your AI memory. Connect documents, notes, emails, code, and research. Your AI understands your goals, work, and preferences.",
  },
  {
    icon: GraduationCap,
    title: "AI Learning System",
    description:
      "AI that teaches — beginner, intermediate, expert. Adapts to age, knowledge level, and learning style.",
  },
  {
    icon: Server,
    title: "Local AI Support",
    description:
      "True ownership. Local models, private deployments, offline mode, enterprise self-hosting. You choose your provider.",
  },
  {
    icon: Network,
    title: "MCP-Native Architecture",
    description:
      "MCP is the universal connector. Databases, files, GitHub, CRM, calendar, IoT, APIs — anything becomes an AI capability.",
  },
  {
    icon: Palette,
    title: "Visual Creation Studio",
    description:
      "Design, documents, presentations, and video — AI creates everything. Reports, slides, branding, and scripts.",
  },
  {
    icon: Workflow,
    title: "Community AI Network",
    description:
      "Open-source at scale. Users contribute agents, connectors, templates, workflows, and models. The ecosystem compounds.",
  },
  {
    icon: Shield,
    title: "Personal AI Infrastructure",
    description:
      "Your AI, your data, your memory, your tools, your agents, your infrastructure. User-owned. User-controlled.",
  },
];


export function Features() {
  return (
    <section id="features" className="border-t border-white/5 py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            15 capabilities. One open platform.
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Analyze, create, automate, learn, build, and solve problems — without vendor lock-in.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border border-white/8 bg-white/[0.02] hover:border-brand-500/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-brand-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
