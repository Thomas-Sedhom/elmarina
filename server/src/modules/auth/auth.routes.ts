import { Router } from "express";
import { z } from "zod";
import { authService } from "./auth.service";
import { requireAuth } from "../../shared/middlewares/auth.middleware";
import { asyncHandler, sendData } from "../../shared/utils/http";

const router = Router();
const credentials = z.object({ phone: z.string().trim().min(8).max(32), password: z.string().min(8).max(128) });

router.post("/login", asyncHandler(async (req, res) => {
  const input = credentials.parse(req.body);
  sendData(res, { user: await authService.login(req, res, input.phone, input.password) });
}));

router.get("/me", requireAuth, asyncHandler(async (req, res) => sendData(res, await authService.me(req))));
router.post("/logout", asyncHandler(async (req, res) => sendData(res, authService.logout(req, res))));

export default router;
