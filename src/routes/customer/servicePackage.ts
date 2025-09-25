import express from "express";
import {
  getServicePackagesByMotorcycle,
  createServicePackage,
  getAllServicePackages,
  getServicePackageById,
  updateServicePackage,
  deleteServicePackage,
  getActiveServicePackages,
  getCustomerServicePackages,
} from "../../controllers/customer/servicePackage.controller";
import { authorize, protect } from "../../middleware/authmiddleware";
import {
  protectAdminOrCustomer,
  protectCustomer,
} from "../../middleware/customerMiddleware";

const router = express.Router();
// "/api/service-packages"

// ===== CUSTOMER ROUTES =====
router.get(
  "/customer/:motorcycleModel",
  protectCustomer,
  getCustomerServicePackages
);

// ===== ADMIN ROUTES =====
router.post(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  createServicePackage
);
router.get(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getAllServicePackages
);
router.get("/active", protectAdminOrCustomer, getActiveServicePackages);
router.get(
  "/motorcycle/:motorcycleId",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getServicePackagesByMotorcycle
);
router.get(
  "/:id",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getServicePackageById
);
router.patch(
  "/:id",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  updateServicePackage
);
router.delete("/:id", protect, authorize("Super-Admin"), deleteServicePackage);

export default router;
