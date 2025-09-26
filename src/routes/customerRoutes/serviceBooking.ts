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
} from "../../controllers/CustomerController/serviceBooking.controller";
import { protectCustomer } from "../../middleware/customerMiddleware";

const router = express.Router();

router.post("/", protectCustomer, createServiceBooking); // by auth customer
router.get("/availability", protectCustomer, checkTimeSlotAvailability);
router.get("/:id", protectCustomer, getServiceBookingById); // Can be accessed with booking ID
router.delete("/:id/cancel", protectCustomer, cancelServiceBooking); // Can cancel with booking ID + email

// Protected routes - Admin only
router.get(
  "/",
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
  "/stats",
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

// Create a extra route for service detail bill where SA/BM can post
// and Customer can get service detail bill.

export default router;
