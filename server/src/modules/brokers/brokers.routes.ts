import { Router } from "express";
import { requireAdmin, requireAuth } from "../../shared/middlewares/auth.middleware";
import { createBroker, getBroker, listBrokers } from "./brokers.controller";

const router = Router();
router.get("/", requireAuth, requireAdmin, listBrokers);
router.post("/", requireAuth, requireAdmin, createBroker);
router.get("/:id", requireAuth, getBroker);
export default router;
