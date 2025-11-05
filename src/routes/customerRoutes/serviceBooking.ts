import express from "express";

import { protect, authorize } from "../../middleware/authmiddleware";
import {
  getBranchUpcomingAppointments,
  createServiceBooking,
  getServiceBookings,
  getServiceBookingById,
  updateBookingStatus,
  cancelServiceBooking,
  getBookingStats,
  checkTimeSlotAvailability,
  getCustomerBookings,
  getCustomerServiceStats,
} from "../../controllers/CustomerController/serviceBooking.controller";
import { protectCustomer } from "../../middleware/customerMiddleware";

const router = express.Router();

// Customer routes (authenticated customers only)
router.post("/", protectCustomer, createServiceBooking);
router.get("/my-bookings", protectCustomer, getCustomerBookings);
router.get("/my-stats", protectCustomer, getCustomerServiceStats);
router.get("/availability", protectCustomer, checkTimeSlotAvailability);
router.get("/:id", protectCustomer, getServiceBookingById);
router.delete("/:id/cancel", protectCustomer, cancelServiceBooking);

// Admin routes - Protected routes for Super Admin and Branch Admin
router.get(
  "/admin/all",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getServiceBookings
);

router.patch(
  "/:id/status",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  updateBookingStatus
);

router.get(
  "/admin/stats",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getBookingStats
);

// Branch-specific routes
router.get(
  "/branch/:branchId/upcoming",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getBranchUpcomingAppointments
);

export default router;
