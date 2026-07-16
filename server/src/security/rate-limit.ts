import type { Request, Response, NextFunction } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function clientKey(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.ip ?? "unknown";
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  if (process.env.E2E === "1" || process.env.DISABLE_RATE_LIMIT === "true") {
    return (_req: Request, _res: Response, next: NextFunction): void => next();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = clientKey(req);
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (existing.count >= options.max) {
      res.status(429).json({
        error: "rate_limit_exceeded",
        message: options.message ?? "Too many requests. Please try again later.",
        retryAfterMs: existing.resetAt - now,
      });
      return;
    }

    existing.count += 1;
    next();
  };
}
