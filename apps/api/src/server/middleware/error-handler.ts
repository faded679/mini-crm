import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../errors.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      status: err.status,
      message: err.message,
      details: err.details,
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    status: 500,
    message: "Internal server error",
  });
}
