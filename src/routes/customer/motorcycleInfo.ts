// src/routes/motorcycleInfo.ts
import express from "express";
import {
  bulkCreateMotorcycles,
  getActiveMotorcycles,
  createMotorcycleInfo,
  getAllMotorcycleInfo,
  getMotorcycleInfoById,
  updateMotorcycleInfo,
  deleteMotorcycleInfo,
  getMotorcyclesByBrand,
  getMotorcyclesByCategory,
  searchMotorcycles,
  getMotorcycleStats,
} from "../../controllers/customer/motorcycleInfo.controller";
import { authorize, protect } from "../../middleware/authmiddleware";

const router = express.Router();
// "/api/motorcycle-info"

// ===== PUBLIC ROUTES =====
router.get("/active", getActiveMotorcycles);
router.get("/search", searchMotorcycles);
router.get("/brand/:brand", getMotorcyclesByBrand);
router.get("/category/:category", getMotorcyclesByCategory);
router.get("/:id", getMotorcycleInfoById);

// ===== ADMIN ROUTES (Super-Admin and Branch-Admin) =====
router.post(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  createMotorcycleInfo
);

router.get(
  "/admin/all",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getAllMotorcycleInfo
);

router.get(
  "/admin/stats",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getMotorcycleStats
);

router.post(
  "/admin/bulk-create",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  bulkCreateMotorcycles
);

router.put(
  "/:id",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  updateMotorcycleInfo
);

// ===== SUPER-ADMIN ONLY ROUTES =====
router.delete("/:id", protect, authorize("Super-Admin"), deleteMotorcycleInfo);

export default router;
