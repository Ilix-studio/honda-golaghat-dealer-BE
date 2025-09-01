// src/routes/customerDashboard.ts
import express from "express";
import {
  getVehicleServiceHistory,
  getCustomerDashboard,
  getCustomerVehicles,
  getCustomerVehicleById,
  createCustomerVehicle,
  updateCustomerVehicle,
  deleteCustomerVehicle,
  getAllCustomerVehicles,
  updateVehicleServiceStatus,
  getServiceDueVehicles,
  getVehicleStats,
  assignVehicleToCustomer,
  transferVehicleOwnership,
} from "../../controllers/customer/customerDash.controller";
import {
  protectCustomer,
  protectAdminOrCustomer,
} from "../../middleware/customerMiddleware";
import { protect, authorize } from "../../middleware/authmiddleware";

const router = express.Router();
// "/api/customer

// ===== CUSTOMER ROUTES (Firebase auth required) =====
router.get("/", protectCustomer, getCustomerDashboard);
router.get("/vehicles", protectCustomer, getCustomerVehicles);
router.get(
  "/vehicles/:vehicleId",
  protectAdminOrCustomer,
  getCustomerVehicleById
);
router.get(
  "/vehicles/:vehicleId/service-history",
  protectAdminOrCustomer,
  getVehicleServiceHistory
);

// ===== ADMIN ROUTES (JWT auth required) =====
// Vehicle management by admin
router.post(
  "/vehicles",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  createCustomerVehicle
);
router.patch(
  "/vehicles/:id",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  updateCustomerVehicle
);
router.delete(
  "/vehicles/:id",
  protect,
  authorize("Super-Admin"),
  deleteCustomerVehicle
);

// Admin vehicle operations
router.get(
  "/admin/vehicles",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getAllCustomerVehicles
);
router.get(
  "/admin/stats",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getVehicleStats
);
router.get(
  "/admin/service-due",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getServiceDueVehicles
);

// Service management
router.patch(
  "/vehicles/:id/service-status",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  updateVehicleServiceStatus
);

// Vehicle assignment and transfer
router.patch(
  "/vehicles/:id/assign",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  assignVehicleToCustomer
);
router.patch(
  "/vehicles/:id/transfer",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  transferVehicleOwnership
);

export default router;
