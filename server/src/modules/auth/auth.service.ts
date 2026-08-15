import { COOKIE_NAME } from "@shared/const";
import { UnauthorizedError } from "@shared/errors";
import { getSessionCookieOptions } from "../../shared/utils/cookies";
import { sdk } from "../../shared/security/session";
import * as db from "../../database";
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
