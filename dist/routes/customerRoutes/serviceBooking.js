"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../../middleware/authmiddleware");
const serviceBooking_controller_1 = require("../../controllers/CustomerController/serviceBooking.controller");
const customerMiddleware_1 = require("../../middleware/customerMiddleware");
const router = express_1.default.Router();
// Customer routes (authenticated customers only)
router.post("/", customerMiddleware_1.protectCustomer, serviceBooking_controller_1.createServiceBooking);
router.get("/my-bookings", customerMiddleware_1.protectCustomer, serviceBooking_controller_1.getCustomerBookings);
router.get("/my-stats", customerMiddleware_1.protectCustomer, serviceBooking_controller_1.getCustomerServiceStats);
router.get("/availability", customerMiddleware_1.protectCustomer, serviceBooking_controller_1.checkTimeSlotAvailability);
router.get("/:id", customerMiddleware_1.protectCustomer, serviceBooking_controller_1.getServiceBookingById);
router.delete("/:id/cancel", customerMiddleware_1.protectCustomer, serviceBooking_controller_1.cancelServiceBooking);
// Admin routes - Protected routes for Super Admin and Branch Admin
router.get("/admin/all", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), serviceBooking_controller_1.getServiceBookings);
router.patch("/:id/status", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), serviceBooking_controller_1.updateBookingStatus);
router.get("/admin/stats", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), serviceBooking_controller_1.getBookingStats);
// Branch-specific routes
router.get("/branch/:branchId/upcoming", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), serviceBooking_controller_1.getBranchUpcomingAppointments);
exports.default = router;
