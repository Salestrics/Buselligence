import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { SIGNUP_FORM_URL } from "../lib/utils";

const plans = [
  {
    name: "Free Trial",
    price: "$0",
    subtitle: "No account required",
    features: [
      "50,000 tokens to explore",
      "BizzyB responses",
      "Business intelligence focus",
      "Chats are not saved",
    ],
    cta: "Start chatting",
    href: "/chat",
    external: false,
    highlighted: false,
  },
  {
    name: "Buselligence Pro",
    price: "Invoice",
    subtitle: "Verified business accounts",
    features: [
      "Unlimited conversations",
      "Saved chat history",
      "Priority model access",
      "Invoice-verified provisioning",
    ],
    cta: "Request access",
    href: SIGNUP_FORM_URL,
    external: true,
    highlighted: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-300">
            Pricing
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Start free. Scale with an invoice.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Anonymous users get 50k tokens to evaluate Buselligence. Full
            accounts require invoice verification through our secure request
            form.
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

              {plan.external ? (
                <a
                  href={plan.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-400"
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : (
                <Link
                  to={plan.href}
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white transition hover:border-white/20"
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
