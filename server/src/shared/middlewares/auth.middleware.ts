import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "@shared/_core/errors";
import { sdk } from "../../../_core/sdk";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    req.user = await sdk.authenticateRequest(req);
    next();
  } catch (error) {
    next(error instanceof Error && "statusCode" in error ? error : UnauthorizedError("Authentication required"));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(UnauthorizedError("Authentication required"));
  if (req.user.role !== "admin") return next(ForbiddenError("Admin access required"));
  next();
}
