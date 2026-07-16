import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Logo } from "../components/Logo";

export function ManifestoPage() {
  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-200">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-center">
          <Logo size="lg" showGlow className="mx-auto" />
          <p className="mt-6 text-sm font-medium uppercase tracking-[0.25em] text-brand-300">
            The Buselligence Manifesto
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">
            AI for Everyone. Owned by Everyone.
          </h1>
        </div>

        <div className="mt-12 space-y-8 text-lg leading-8 text-slate-300">
          <p>
            AI is the greatest tool humanity has ever created. It should not be limited to
            corporations, engineers, or those who can afford expensive software.
          </p>
          <p>
            Buselligence exists to put the power of AI into the hands of everyone — enabling
            anyone to <strong className="text-white">learn, create, build, automate, and achieve more</strong>.
          </p>
          <blockquote className="border-l-4 border-brand-500 pl-6 italic text-slate-400">
            Mission: Give every person the power of AI.
          </blockquote>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-white">What we believe</h2>
          <ul className="mt-6 space-y-4">
            {[
              "AI should not belong only to large companies",
              "Every person deserves an AI teammate — not just a chatbot",
              "Open models, open protocols, and open source are essential",
              "Your data, your memory, your tools, your agents, your infrastructure",
              "AI capability should be a public utility, not a luxury product",
            ].map((belief) => (
              <li key={belief} className="flex items-start gap-3 text-slate-300">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                {belief}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-xl font-semibold text-white">The new category</h2>
          <p className="mt-4 text-slate-400">
            Not a business intelligence chatbot. Not just an AI assistant. Not only a coding tool.
            Not a no-code builder.
          </p>
          <p className="mt-4 text-2xl font-semibold text-brand-300">
            The Open Source AI Operating System
          </p>
          <p className="mt-2 text-slate-400">Open AI Empowerment Platform</p>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-white">Personal AI Infrastructure</h2>
          <p className="mt-4 text-slate-400">Everyone gets:</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {["Your AI", "Your Data", "Your Memory", "Your Tools", "Your Agents", "Your Infrastructure"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-center text-sm text-slate-300"
                >
                  {item}
                </div>
              )
            )}
          </div>
        </section>

        <div className="mt-16 flex flex-wrap justify-center gap-4">
          <Link
            to="/sign-up"
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-medium text-white hover:bg-brand-400"
          >
            Join the movement
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/workspace"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm text-slate-200 hover:border-white/20"
          >
            Open your workspace
          </Link>
        </div>
      </main>
    </div>
  );
}
