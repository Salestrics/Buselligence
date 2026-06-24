import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { useSession, signOut } from "../lib/auth-client";
import { cn, SIGNUP_FORM_URL } from "../lib/utils";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/chat", label: "Try Free" },
];

export function Navbar() {
  const { data: session } = useSession();
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0b1020]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-lg font-semibold tracking-tight">
            Buselligence
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {isLanding &&
            links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-slate-300 transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                to="/chat"
                className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-400"
              >
                Open Chat
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:text-white"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/sign-in"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:text-white"
              >
                Sign in
              </Link>
              <a
                href={SIGNUP_FORM_URL}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-400"
                )}
              >
                Request Access
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
