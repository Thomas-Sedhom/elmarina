import { Router } from "express";
import { requireAdmin, requireAuth } from "../../shared/middlewares/auth.middleware";
import {
  createBroker,
  deleteBroker,
  getBroker,
  getMyBrokerAccount,
  listBrokers,
  toggleBlockBroker,
  updateBrokerPassword,
} from "./brokers.controller";

const router = Router();
router.get("/", requireAuth, requireAdmin, listBrokers);
router.post("/", requireAuth, requireAdmin, createBroker);
router.get("/me/account", requireAuth, getMyBrokerAccount);
router.patch("/:id/block", requireAuth, requireAdmin, toggleBlockBroker);
router.patch("/:id/password", requireAuth, requireAdmin, updateBrokerPassword);
router.delete("/:id", requireAuth, requireAdmin, deleteBroker);
router.get("/:id", requireAuth, getBroker);
export default router;
