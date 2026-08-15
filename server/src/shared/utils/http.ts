import type { NextFunction, Request, RequestHandler, Response } from "express";
import { HttpError } from "@shared/errors";

export const asyncHandler = (handler: (req: Request, res: Response, next: NextFunction) => unknown): RequestHandler =>
  (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export const sendData = (res: Response, data: unknown, status = 200) => res.status(status).json({ data });

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = error instanceof HttpError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error";
  if (status >= 500) console.error("[HTTP]", error);
  res.status(status).json({ error: { message } });
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ error: { message: "Route not found" } });
};
