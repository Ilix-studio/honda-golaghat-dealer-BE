import express from "express";
import {
  createServiceBooking,
  getServiceBookings,
  getServiceBookingById,
  updateBookingStatus,
  cancelServiceBooking,
  getBranchUpcomingAppointments,
  getBookingStats,
  checkTimeSlotAvailability,
} from "../controllers/serviceBooking.controller";
import { protect, authorize } from "../middleware/authmiddleware";

const router = express.Router();

// Public routes
router.post("/", createServiceBooking); // by auth customer
router.get("/availability", checkTimeSlotAvailability);
router.get("/:id", getServiceBookingById); // Can be accessed with booking ID
router.delete("/:id/cancel", cancelServiceBooking); // Can cancel with booking ID + email

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
