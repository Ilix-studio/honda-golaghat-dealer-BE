// src/routes/customer.ts
import express from "express";

import {
  createProfile,
  getCustomerProfile,
  updateCustomerProfile,
  deleteCustomer,
  getAllCustomers,
  getCustomerById,
  verifyCustomer,
  getCustomerStats,
  searchCustomers,
  getCustomersByLocation,
  verifyOTP,
} from "../../controllers/customer/customer.controller";
import {
  protectAdminOrCustomer,
  protectCustomer,
} from "../../middleware/customerMiddleware";
import { authorize, protect } from "../../middleware/authmiddleware";
import { registerCustomer } from "../../controllers/customer/a_register.controller";

const router = express.Router();
// "/api/customer"

router.post("/verify-otp", verifyOTP);

// ===== CUSTOMER ROUTES (Customer authentication required) =====
router.post("/profile", createProfile);
router.get("/profile", protectCustomer, getCustomerProfile);
router.patch("/profile", protectCustomer, updateCustomerProfile);

// Customer can access their own data
router.get("/:customerId", protectAdminOrCustomer, getCustomerById);

// ===== ADMIN ROUTES (Admin authentication required) =====
router.get(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getAllCustomers
);
router.get(
  "/stats",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getCustomerStats
);
router.get(
  "/search",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  searchCustomers
);

// Location-based routes
router.get(
  "/location/:district",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getCustomersByLocation
);

// Customer management by admin
router.patch(
  "/:id/verify",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  verifyCustomer
);
router.delete("/:id", protect, authorize("Super-Admin"), deleteCustomer);
// Add recovery System

export default router;
