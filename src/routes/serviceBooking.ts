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
router.post("/", createServiceBooking);
router.get("/availability", checkTimeSlotAvailability);
router.get("/:id", getServiceBookingById); // Can be accessed with booking ID
router.put("/:id/cancel", cancelServiceBooking); // Can cancel with booking ID + email

// Protected routes - Admin only
router.get(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getServiceBookings
);
router.put(
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

export default router;
