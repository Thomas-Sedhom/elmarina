import { Router } from "express";
import { requireAdmin, requireAuth } from "../../shared/middlewares/auth.middleware";
import {
  createRequest,
  deleteRequest,
  getRequest,
  listRequests,
  uploadRequestImage,
} from "./requests.controller";

const router = Router();

router.get("/", requireAuth, listRequests);
router.get("/:id", requireAuth, getRequest);
router.post("/upload-image", requireAuth, uploadRequestImage);
router.post("/", requireAuth, createRequest);
router.delete("/:id", requireAuth, requireAdmin, deleteRequest);

export default router;
