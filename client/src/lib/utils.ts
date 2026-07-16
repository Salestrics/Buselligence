import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SIGNUP_FORM_URL: string | null =
  import.meta.env.VITE_SIGNUP_FORM_URL || null;

export const FREE_TOKEN_LIMIT = 50_000;

export function formatTokenCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
}

export function getAnonymousSessionId(): string {
  // Anonymous sessions are issued as signed httpOnly cookies by the server.
  return "";
}
