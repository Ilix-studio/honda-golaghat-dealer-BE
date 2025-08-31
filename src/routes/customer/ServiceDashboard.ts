import express from "express";

import {
  getServiceHistory,
  getCustomerServiceDashboard,
  getAvailableServices,
  getServiceDetails,
  getServiceRecommendations,
} from "../../controllers/customer/ServiceDash.controller";
import { protectCustomer } from "../../middleware/customerMiddleware";

const router = express.Router();
// "/api/customer-service-dashboard"

// Customer service dashboard routes
router.get("/", protectCustomer, getCustomerServiceDashboard);
router.get("/available-services", protectCustomer, getAvailableServices);
router.get("/service/:serviceType", protectCustomer, getServiceDetails);
router.get("/history", protectCustomer, getServiceHistory);
router.get("/recommendations", protectCustomer, getServiceRecommendations);

export default router;
