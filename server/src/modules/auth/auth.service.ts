import { COOKIE_NAME } from "@shared/const";
import { UnauthorizedError } from "@shared/_core/errors";
import { getSessionCookieOptions } from "../../../_core/cookies";
import { sdk } from "../../../_core/sdk";
import * as db from "../../../db";
import type { Request, Response } from "express";

export class AuthService {
  async login(req: Request, res: Response, phone: string, password: string) {
    const user = await db.authenticateLocalUser(phone, password);
    if (!user) throw UnauthorizedError("Invalid phone or password");
    const token = await sdk.createSessionToken(user.openId, { name: user.name ?? undefined });
    res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: 1000 * 60 * 60 * 24 * 30 });
    return db.toSafeUser(user);
  }

  async me(req: Request) {
    if (!req.user) throw UnauthorizedError("Authentication required");
    return db.toSafeUser(req.user);
  }

  logout(req: Request, res: Response) {
    res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(req), maxAge: -1 });
    return { success: true };
  }
}

export const authService = new AuthService();
