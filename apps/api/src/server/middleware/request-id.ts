import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export function requestId(req: Request, _res: Response, next: NextFunction) {
  req.headers["x-request-id"] =
    (req.headers["x-request-id"] as string) ?? randomUUID();
  next();
}
