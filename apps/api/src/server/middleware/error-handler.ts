import type { NextFunction, Request, Response } from "express";

import { ApiError, type ApiErrorBody } from "../errors.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req as any).requestId as string | undefined;

  if (err instanceof ApiError) {
    const body: ApiErrorBody = {
      code: err.code,
      message: err.message,
      details: err.details,
      requestId,
    };
    res.status(err.status).json(body);
    return;
  }

  const body: ApiErrorBody = {
    code: "INTERNAL_ERROR",
    message: "Internal server error",
    requestId,
  };

  // eslint-disable-next-line no-console
  console.error({ requestId, err });
  res.status(500).json(body);
}
