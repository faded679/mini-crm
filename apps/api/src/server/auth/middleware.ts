import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "./jwt.js";
import { ApiError } from "../errors.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing or invalid Authorization header");
  }

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    (req as any).manager = payload;
    next();
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
}
