import express from "express";
import {
  protectAdminOrCustomer,
  protectCustomer,
} from "../../middleware/customerMiddleware";
import { authorize, protect } from "../../middleware/authmiddleware";
import {
  getCustomerProfile,
  createProfile,
  updateCustomerProfile,
  getAllCustomers,
  getCustomerById,
} from "../../controllers/customer/profile.controller";

const router = express.Router();

// ===== CUSTOMER ROUTES (Customer authentication required) =====
router.post("/create", protectCustomer, createProfile);
router.get("/get", protectCustomer, getCustomerProfile);
router.patch("/update", protectCustomer, updateCustomerProfile);

// Customer can access their own data
router.get("/:customerId", protectAdminOrCustomer, getCustomerById);

// ===== ADMIN ROUTES (Admin authentication required) =====
router.get(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getAllCustomers
);

export default router;
