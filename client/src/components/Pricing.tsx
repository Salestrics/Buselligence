import { Link } from "react-router-dom";
import { ArrowRight, Check, GitBranch, Server } from "lucide-react";

const plans = [
  {
    name: "Self-hosted",
    price: "Free",
    subtitle: "MIT license",
    features: [
      "Bring your own API keys",
      "OpenAI, Anthropic, Google",
      "MCP server integrations",
      "Saved conversations",
    ],
    cta: "Get started",
    href: "/sign-up",
    highlighted: true,
  },
  {
    name: "Demo mode",
    price: "$0",
    subtitle: "Optional server key",
    features: [
      "Anonymous trial when OPENAI_API_KEY is set",
      "50,000 demo tokens",
      "Sign up for unlimited BYOK usage",
      "Full MCP support after sign-in",
    ],
    cta: "Try chat",
    href: "/chat",
    highlighted: false,
  },
];

const mcpExamples = [
  "@modelcontextprotocol/server-postgres",
  "@modelcontextprotocol/server-filesystem",
  "@modelcontextprotocol/server-sqlite",
  "Custom SSE / HTTP MCP servers",
];

export function Pricing() {
  return (
    <>
      <section id="integrations" className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-300">
                MCP
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">
                Connect live data with Model Context Protocol
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Buselligence is MCP-native — the universal connector for AI capabilities.
                Add stdio, SSE, or HTTP MCP servers and anything becomes an AI tool:
                databases, files, GitHub, CRM, calendar, IoT, and custom APIs.
              </p>
              <Link
                to="/settings"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-300 hover:text-white"
              >
                Configure MCP servers
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
              <div className="mb-4 inline-flex rounded-xl bg-brand-500/15 p-3 text-brand-300">
                <Server className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-white">Supported transports</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li>stdio — local MCP processes (npx, uvx, custom binaries)</li>
                <li>SSE — remote MCP servers over Server-Sent Events</li>
                <li>HTTP — streamable HTTP MCP endpoints</li>
              </ul>
              <p className="mt-6 text-sm font-medium text-white">Popular servers</p>
              <ul className="mt-3 space-y-2">
                {mcpExamples.map((example) => (
                  <li
                    key={example}
                    className="rounded-xl border border-white/8 bg-[#0b1020] px-3 py-2 font-mono text-xs text-slate-300"
                  >
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-300">
              Open source
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">
              Freedom of AI usage
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
              No platform markup on tokens. You pay your provider directly. Host
              it yourself, fork it, and extend it under the MIT license.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-3xl border p-8 ${
                  plan.highlighted
                    ? "border-brand-500/40 bg-gradient-to-b from-brand-500/10 to-transparent"
                    : "border-white/8 bg-white/[0.03]"
                }`}
              >
                <p className="text-sm font-medium text-brand-300">{plan.name}</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-4xl font-semibold text-white">
                    {plan.price}
                  </span>
                  <span className="pb-1 text-sm text-slate-400">
                    {plan.subtitle}
                  </span>
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-slate-300"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.href}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition ${
                    plan.highlighted
                      ? "bg-brand-500 text-white hover:bg-brand-400"
                      : "border border-white/10 text-white hover:border-white/20"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href="https://github.com/Salestrics/Buselligence"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <GitBranch className="h-4 w-4" />
              View source on GitHub
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
