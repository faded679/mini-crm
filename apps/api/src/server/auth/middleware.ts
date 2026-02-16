import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../errors.js";
import { verifyAccessToken, type JwtPayload } from "./jwt.js";

export type AuthedRequest = Request & { manager: JwtPayload };

export function requireManagerAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    next(new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Missing bearer token" }));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    (req as AuthedRequest).manager = payload;
    next();
  } catch {
    next(new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Invalid token" }));
  }
}
