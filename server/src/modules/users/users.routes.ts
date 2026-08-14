import { Router } from "express";
import { requireAuth } from "../../shared/middlewares/auth.middleware";
import { getCurrentUser } from "./users.controller";

const router = Router();
router.get("/me", requireAuth, getCurrentUser);
export default router;
