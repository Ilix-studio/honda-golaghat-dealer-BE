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
  deleteVehicle,
  updateServiceStatus,
  getServiceDueVehicles,
  transferVehicle,
  createVehicleFromStock,
  updateVehicle,
} from "../../controllers/BikeSystemController2/vehicle.controller";

const router = express.Router();

router.get("/my-vehicles", protectCustomer, getMyVehicles); // Customer-Dashboard
router.get("/:id", protectAdminOrCustomer, getVehicleById); // Customer-Dashboard

// Vehicle CRUD operations
router.get(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getAllCustomerVehicles //Super-Admin Dashboard
);

router.post(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  createVehicleFromStock
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
