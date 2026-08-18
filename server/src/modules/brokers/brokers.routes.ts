import { Router } from "express";
import { requireAdmin, requireAuth } from "../../shared/middlewares/auth.middleware";
import { createBroker, getBroker, getMyBrokerAccount, listBrokers, toggleBlockBroker } from "./brokers.controller";

const router = Router();
router.get("/", requireAuth, requireAdmin, listBrokers);
router.post("/", requireAuth, requireAdmin, createBroker);
router.get("/me/account", requireAuth, getMyBrokerAccount);
router.patch("/:id/block", requireAuth, requireAdmin, toggleBlockBroker);
router.get("/:id", requireAuth, getBroker);
export default router;
