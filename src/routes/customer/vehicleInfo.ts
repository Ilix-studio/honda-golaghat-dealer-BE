// src/routes/motorcycleInfo.ts
import express from "express";
import {
  bulkCreateMotorcycles,
  getActiveMotorcycles,
  createVehicleInfo,
  getAllVehicleInfo,
  getVehicleInfoById,
  updateVehicleInfo,
  deleteVehicleInfo,
  getMotorcyclesByCategory,
  searchMotorcycles,
  getMotorcycleStats,
} from "../../controllers/customer/vehicleInfo.controller";
import { authorize, protect } from "../../middleware/authmiddleware";

const router = express.Router();
// "/api/motorcycle-info"

// ===== PUBLIC ROUTES =====
router.get("/active", getActiveMotorcycles);
router.get("/search", searchMotorcycles);
router.get("/category/:category", getMotorcyclesByCategory);
router.get("/:id", getVehicleInfoById);

// ===== ADMIN ROUTES (Super-Admin and Branch-Admin) =====
router.post(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  createVehicleInfo
);

router.get(
  "/admin/all",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getAllVehicleInfo
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

router.patch(
  "/:id",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  updateVehicleInfo
);

// ===== SUPER-ADMIN ONLY ROUTES =====
router.delete("/:id", protect, authorize("Super-Admin"), deleteVehicleInfo);

export default router;
