import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers["x-request-id"] as string | undefined) ?? randomUUID();
  (req as any).requestId = id;
  res.setHeader("x-request-id", id);
  next();
}
