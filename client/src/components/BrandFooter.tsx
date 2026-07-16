import { Link } from "react-router-dom";
import { GitBranch } from "lucide-react";
import {
  copyrightYear,
  FORK_NOTICE,
  PROJECT_NAME,
  TRADEMARK_OWNER,
  TRADEMARK_SHORT,
} from "../lib/brand";

interface BrandFooterProps {
  /** Show extended trademark notice (landing/about pages). */
  extended?: boolean;
  className?: string;
}

export function BrandFooter({ extended = false, className = "" }: BrandFooterProps) {
  return (
    <footer className={`border-t border-white/5 py-10 ${className}`}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">
          <div className="max-w-xl text-center md:text-left">
            <p>
              © {copyrightYear()} {TRADEMARK_OWNER}
            </p>
            <p className="mt-1">{TRADEMARK_SHORT}</p>
            <p className="mt-1 text-xs text-slate-600">
              {PROJECT_NAME} · MIT License
            </p>
            {extended ? (
              <p className="mt-3 text-xs leading-relaxed text-slate-600">{FORK_NOTICE}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/manifesto" className="hover:text-slate-300">
              Manifesto
            </Link>
            <Link to="/why" className="hover:text-slate-300">
              About
            </Link>
            <Link to="/workspace" className="hover:text-slate-300">
              Workspace
            </Link>
            <a
              href="https://github.com/Salestrics/Buselligence/blob/main/docs/TRADEMARK.md"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300"
            >
              Trademark
            </a>
            <a
              href="https://github.com/Salestrics/Buselligence"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-slate-300"
            >
              <GitBranch className="h-3.5 w-3.5" /> GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
