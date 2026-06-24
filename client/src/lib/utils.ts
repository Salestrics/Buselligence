import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SIGNUP_FORM_URL =
  import.meta.env.VITE_SIGNUP_FORM_URL ??
  "https://us.posthog.com/external_surveys/019ef6e9-52a9-0000-3656-79f8425b5e13";

export const FREE_TOKEN_LIMIT = 50_000;

export function formatTokenCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
}

export function getAnonymousSessionId(): string {
  const key = "buselligence_anonymous_session";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
