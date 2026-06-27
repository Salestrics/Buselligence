import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, Sparkles } from "lucide-react";
import { Features } from "../components/Features";
import { Navbar } from "../components/Navbar";
import { Pricing } from "../components/Pricing";
import { SIGNUP_FORM_URL } from "../lib/utils";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(180deg,#0b1020_0%,#0d1328_100%)]">
      <Navbar />

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-200">
                <Sparkles className="h-3.5 w-3.5" />
                Powered by BizzyB
              </div>

              <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
                Your business intelligence copilot
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
                Buselligence turns complex data questions into clear answers —
                SQL, KPIs, forecasts, and executive narratives in a ChatGPT-style
                experience built for operators.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/chat"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-400"
                >
                  Try 50k tokens free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {SIGNUP_FORM_URL ? (
                  <a
                    href={SIGNUP_FORM_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:text-white"
                  >
                    Request account with invoice
                  </a>
                ) : (
                  <Link
                    to="/sign-in"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:text-white"
                  >
                    Sign in
                  </Link>
                )}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  ["50k", "Free anonymous tokens"],
                  ["BizzyB", "The Buselligence AI"],
                  ["Invoice", "Verified sign-up only"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"
                  >
                    <p className="text-2xl font-semibold text-white">{value}</p>
                    <p className="mt-1 text-sm text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-brand-500/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#121a2f] shadow-2xl shadow-brand-900/20">
                <div className="flex items-center gap-2 border-b border-white/8 px-5 py-4">
                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                    <span className="h-3 w-3 rounded-full bg-amber-300/80" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="ml-2 text-xs text-slate-400">
                    Buselligence Chat
                  </span>
                </div>

                <div className="space-y-4 p-6">
                  <div className="rounded-2xl bg-white/[0.04] p-4 text-left">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      You
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      What KPIs should I track for a B2B SaaS with usage-based
                      pricing?
                    </p>
                  </div>

                  <div className="rounded-2xl border border-brand-500/20 bg-brand-500/10 p-4 text-left">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-brand-200">
                      <MessageSquare className="h-3.5 w-3.5" />
                      BizzyB
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Focus on net revenue retention, expansion MRR, consumption
                      depth per account, gross margin by cohort, and payback
                      period by channel. I can also draft a board-ready KPI
                      tree.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Features />
        <Pricing />
      </main>

      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-500 md:flex-row">
          <div className="text-center md:text-left">
            <p>© {new Date().getFullYear()} Salestrics Inc</p>
            <p className="mt-1">
              Powered by{" "}
              <a
                href="https://salestrics.com"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 transition hover:text-white"
              >
                Salestrics
              </a>
            </p>
          </div>
          <div className="flex gap-6">
            <Link to="/chat" className="hover:text-slate-300">
              Chat
            </Link>
            <Link to="/sign-in" className="hover:text-slate-300">
              Sign in
            </Link>
            {SIGNUP_FORM_URL ? (
              <a
                href={SIGNUP_FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="hover:text-slate-300"
              >
                Request access
              </a>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
