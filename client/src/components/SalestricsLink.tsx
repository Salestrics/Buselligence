import { CREATOR_URL, TRADEMARK_OWNER } from "../lib/brand";

interface SalestricsLinkProps {
  className?: string;
}

/** Links Salestrics Inc. to the official creator site in copyright notices. */
export function SalestricsLink({ className = "hover:text-slate-300" }: SalestricsLinkProps) {
  return (
    <a href={CREATOR_URL} target="_blank" rel="noreferrer" className={className}>
      {TRADEMARK_OWNER}
    </a>
  );
}
