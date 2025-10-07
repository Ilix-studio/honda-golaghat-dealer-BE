import express from "express";
import { authorize, protect } from "../../middleware/authmiddleware";
import {
  assignServiceToCustomer,
  createServiceAddon,
  getServiceAddonById,
  getServiceAddons,
} from "../../controllers/BikeSystemController2/servicePackage.controller";

const router = express.Router();
// "/api/service-addons"

// Create service addon (Admin only)
router.post(
  "/create",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  createServiceAddon
);

// Get all service addons with filtering
router.get(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getServiceAddons
);

// Get service addon by ID
router.get(
  "/:id",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getServiceAddonById
);

// Assign service to customer
router.post(
  "/:id/assign",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  assignServiceToCustomer
);

export default router;
