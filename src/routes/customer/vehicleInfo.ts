import express from "express";
import {
  protectCustomer,
  protectAdminOrCustomer,
} from "../../middleware/customerMiddleware";
import { protect, authorize } from "../../middleware/authmiddleware";
import {
  getVehicleStats,
  getAllCustomerVehicles,
  getMyVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateServiceStatus,
  getServiceDueVehicles,
  transferVehicle,
} from "../../controllers/customer/vehicle.controller";

const router = express.Router();
// Base route: /api/customer-vehicles

// ===== PUBLIC ROUTES =====

// ===== CUSTOMER ROUTES (Firebase auth required) =====
router.get("/my-vehicles", protectCustomer, getMyVehicles);
router.get("/:id", protectAdminOrCustomer, getVehicleById);

// ===== ADMIN ROUTES (JWT auth required) =====

// Vehicle CRUD operations
router.get(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getAllCustomerVehicles
);

router.post(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  createVehicle
);

router.put(
  "/:id",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  updateVehicle
);

router.delete("/:id", protect, authorize("Super-Admin"), deleteVehicle);

// Service management
router.put(
  "/:id/service-status",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  updateServiceStatus
);

router.get(
  "/admin/service-due",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getServiceDueVehicles
);

// Statistics and reporting
router.get(
  "/admin/stats",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getVehicleStats
);

// Vehicle ownership transfer
router.put(
  "/:id/transfer",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  transferVehicle
);

export default router;
