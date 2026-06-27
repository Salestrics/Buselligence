import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { signIn } from "../lib/auth-client";
import { SIGNUP_FORM_URL } from "../lib/utils";

export function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    navigate("/chat");
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
            Welcome back. Sign in to save conversations and continue beyond the
            free token limit.
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

          <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm font-medium text-amber-100">
              No direct sign-up
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-100/80">
              Buselligence accounts require invoice verification. Submit your
              invoice details through our secure request form and we&apos;ll
              provision credentials within 1–2 business days.
            </p>
            {SIGNUP_FORM_URL ? (
              <a
                href={SIGNUP_FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-medium text-brand-200 hover:text-white"
              >
                Request access with invoice →
              </a>
            ) : (
              <p className="mt-4 text-sm text-amber-100/70">
                Configure <code className="text-amber-100">VITE_SIGNUP_FORM_URL</code>{" "}
                to enable account requests.
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Just exploring?{" "}
            <Link to="/chat" className="text-brand-300 hover:text-white">
              Try 50k free tokens
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
