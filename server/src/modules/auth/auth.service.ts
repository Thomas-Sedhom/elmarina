import { COOKIE_NAME } from "@shared/const";
import { UnauthorizedError } from "@shared/errors";
import { getSessionCookieOptions } from "../../shared/utils/cookies";
import { sdk } from "../../shared/security/session";
import { verifyPassword } from "../../shared/utils/crypto";
import { usersRepository } from "../users/users.repository";
import type { Request, Response } from "express";

export class AuthService {
  async login(req: Request, res: Response, phone: string, password: string) {
    const user = await usersRepository.findByPhone(phone, true);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw UnauthorizedError("Invalid phone or password");
    }
    await usersRepository.updateLastSignedIn(user.id);
    const token = await sdk.createSessionToken(user.id, { name: user.name ?? undefined });
    res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: 1000 * 60 * 60 * 24 * 30 });
    return usersRepository.toSafeUser(user);
  }

  async me(req: Request) {
    if (!req.user) throw UnauthorizedError("Authentication required");
    return usersRepository.toSafeUser(req.user);
  }

  logout(req: Request, res: Response) {
    res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(req), maxAge: -1 });
    return { success: true };
  }
}

export const authService = new AuthService();
