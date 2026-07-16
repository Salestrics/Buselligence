import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { SalestricsLink } from "../components/SalestricsLink";
import { signUp } from "../lib/auth-client";

export function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signUpError } = await signUp.email({
      name,
      email,
      password,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message ?? "Unable to create account");
      return;
    }

    navigate("/settings");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0b1020_0%,#10182f_100%)]">
      <Navbar />

      <main className="mx-auto flex max-w-md flex-col px-6 py-16">
        <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-8">
          <div className="mb-6 inline-flex rounded-xl bg-brand-500/15 p-3 text-brand-300">
            <UserPlus className="h-5 w-5" />
          </div>

          <h1 className="text-2xl font-semibold text-white">Create account</h1>
          <p className="mt-2 text-sm text-slate-400">
            Buselligence is open source and MIT-licensed. Sign up, add your own
            API key, and connect MCP servers for live business intelligence.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-white outline-none transition focus:border-brand-500"
                placeholder="Your name"
              />
            </label>

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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-white outline-none transition focus:border-brand-500"
                placeholder="At least 8 characters"
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
              Create account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/sign-in" className="text-brand-300 hover:text-white">
              Sign in
            </Link>
          </p>
          <p className="mt-8 text-center text-xs text-slate-600">
            The Buselligence Project · MIT · Buselligence™ is a trademark of{" "}
            <SalestricsLink className="hover:text-slate-400" />.
          </p>
        </div>
      </main>
    </div>
  );
}
