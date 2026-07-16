import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { signIn } from "../lib/auth-client";

export function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";
  const next = searchParams.get("next") ?? "/chat";
  const [email, setEmail] = useState(isDemo ? "demo@buselligence.com" : "");
  const [password, setPassword] = useState(isDemo ? "demo123456" : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn.email({ email, password });

    setLoading(false);

    if (signInError) {
      setError(signInError.message ?? "Unable to sign in");
      return;
    }

    navigate(next.startsWith("/") ? next : `/${next}`);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0b1020_0%,#10182f_100%)]">
      <Navbar />

      <main className="mx-auto flex max-w-md flex-col px-6 py-16">
        <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-8">
          <div className="mb-6 inline-flex rounded-xl bg-brand-500/15 p-3 text-brand-300">
            <Lock className="h-5 w-5" />
          </div>

          <h1 className="text-2xl font-semibold text-white">Sign in</h1>
          <p className="mt-2 text-sm text-slate-400">
            Welcome back. Sign in to use your API keys, MCP integrations, and
            saved conversations.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-white outline-none transition focus:border-brand-500"
                placeholder="you@company.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-white outline-none transition focus:border-brand-500"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-400 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-brand-500/20 bg-brand-500/10 p-4">
            <p className="text-sm font-medium text-brand-100">
              {isDemo ? "Demo account ready" : "New to Buselligence?"}
            </p>
            <p className="mt-2 text-sm leading-6 text-brand-100/80">
              {isDemo
                ? "demo@buselligence.com / demo123456 — run npm run setup if sign-in fails."
                : "Create a free account, add your API key in Settings, and connect MCP servers for live BI workflows."}
            </p>
            {!isDemo && (
              <Link
                to="/sign-up"
                className="mt-4 inline-flex text-sm font-medium text-white hover:text-brand-200"
              >
                Create account →
              </Link>
            )}
            {isDemo && (
              <Link
                to="/start"
                className="mt-4 inline-flex text-sm font-medium text-white hover:text-brand-200"
              >
                Continue to Hello World →
              </Link>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Exploring without an account?{" "}
            <Link to="/chat" className="text-brand-300 hover:text-white">
              Try demo chat
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
