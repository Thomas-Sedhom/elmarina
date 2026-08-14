import { Router } from "express";
import { requireAdmin, requireAuth } from "../../shared/middlewares/auth.middleware";
import { createEntry, deleteEntry, listEntries, updateEntry } from "./ledger.controller";

const router = Router();
router.get("/broker/:brokerAccountId", requireAuth, listEntries);
router.post("/", requireAuth, requireAdmin, createEntry);
router.patch("/:id", requireAuth, requireAdmin, updateEntry);
router.delete("/:id", requireAuth, requireAdmin, deleteEntry);
export default router;
