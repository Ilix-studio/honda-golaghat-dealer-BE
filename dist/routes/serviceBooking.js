"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const serviceBooking_controller_1 = require("../controllers/serviceBooking.controller");
const authmiddleware_1 = require("../middleware/authmiddleware");
const router = express_1.default.Router();
// Public routes
router.post("/", serviceBooking_controller_1.createServiceBooking);
router.get("/availability", serviceBooking_controller_1.checkTimeSlotAvailability);
router.get("/:id", serviceBooking_controller_1.getServiceBookingById); // Can be accessed with booking ID
router.put("/:id/cancel", serviceBooking_controller_1.cancelServiceBooking); // Can cancel with booking ID + email
// Protected routes - Admin only
router.get("/", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), serviceBooking_controller_1.getServiceBookings);
router.put("/:id/status", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), serviceBooking_controller_1.updateBookingStatus);
router.get("/stats", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), serviceBooking_controller_1.getBookingStats);
// Branch-specific routes
router.get("/branch/:branchId/upcoming", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), serviceBooking_controller_1.getBranchUpcomingAppointments);
exports.default = router;
