import express from "express";
import {
  activateCustomerService,
  createValueAddedService,
  getAllValueAddedServices,
  getValueAddedServiceById,
  updateValueAddedService,
  deleteValueAddedService,
  getCustomerEligibleServices,
  toggleBadgeStatus,
  calculateServicePrice,
  getCustomerActiveServices,
  getServicesByType,
  getCustomersWithActiveVAS,
} from "../../controllers/BikeSystemController2/vas.controller";
import { authorize, protect } from "../../middleware/authmiddleware";
import { protectCustomer } from "../../middleware/customerMiddleware";

const router = express.Router();
// "/api/value-added-services"

// ===== ADMIN ROUTES =====
router.post(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  createValueAddedService
);

router.get(
  "/admin",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getAllValueAddedServices
);

router.get(
  "/admin/customers",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getCustomersWithActiveVAS
);

router.get(
  "/admin/:id",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getValueAddedServiceById
);

router.patch(
  "/admin/:id",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  updateValueAddedService
);

router.delete(
  "/admin/:id",
  protect,
  authorize("Super-Admin"),
  deleteValueAddedService
);

// Badge management
router.patch(
  "/admin/:id/badges/:badgeId/toggle",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  toggleBadgeStatus
);

// Customer service activation
router.post(
  "/admin/activate",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  activateCustomerService
);

// ===== CUSTOMER ROUTES =====
router.get("/eligible", protectCustomer, getCustomerEligibleServices);
router.get("/my-services", protectCustomer, getCustomerActiveServices);
router.post("/calculate-price", protectCustomer, calculateServicePrice);

// ===== PUBLIC/MIXED ROUTES =====
router.get("/types/:serviceType", getServicesByType);

export default router;
