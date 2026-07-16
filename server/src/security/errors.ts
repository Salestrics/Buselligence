import type { ErrorRequestHandler, Request, Response, NextFunction } from "express";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}

export const globalErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof Error ? err.message : "Internal server error";

  if (status >= 500) {
    console.error("Unhandled error:", err);
  }

  res.status(status).json({ error: message });
};
