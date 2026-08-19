import { Router } from "express";
import { requireAdmin, requireAuth } from "../../shared/middlewares/auth.middleware";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
  uploadProductImage,
} from "./products.controller";

const router = Router();

// Products can be viewed by both authenticated Admins and Brokers
router.get("/", requireAuth, listProducts);
router.get("/:id", requireAuth, getProduct);

// Products management restricted to Admin only
router.post("/upload-image", requireAuth, requireAdmin, uploadProductImage);
router.post("/", requireAuth, requireAdmin, createProduct);
router.patch("/:id", requireAuth, requireAdmin, updateProduct);
router.delete("/:id", requireAuth, requireAdmin, deleteProduct);

export default router;
