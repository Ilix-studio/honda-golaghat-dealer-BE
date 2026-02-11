"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTimeSlotAvailability = exports.getBookingStats = exports.getBranchUpcomingAppointments = exports.cancelServiceBooking = exports.updateBookingStatus = exports.getServiceBookingById = exports.getServiceBookings = exports.createServiceBooking = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const ServiceBooking_1 = __importDefault(require("../models/ServiceBooking"));
const Branch_1 = __importDefault(require("../models/Branch"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const user_types_1 = require("../types/user.types");
/**
 * @desc    Create a new service booking
 * @route   POST /api/service-bookings
 * @access  Public
 */
exports.createServiceBooking = (0, express_async_handler_1.default)(async (req, res) => {
    const { bikeModel, year, vin, mileage, registrationNumber, serviceType, additionalServices, serviceLocation, appointmentDate, appointmentTime, firstName, lastName, email, phone, specialRequests, isDropOff, willWaitOnsite, termsAccepted, } = req.body;
    // Validate required fields
    if (!bikeModel ||
        !year ||
        !mileage ||
        !serviceType ||
        !serviceLocation ||
        !appointmentDate ||
        !appointmentTime ||
        !firstName ||
        !lastName ||
        !email ||
        !phone ||
        !termsAccepted) {
        res.status(400);
        throw new Error("Please provide all required fields");
    }
    // Validate service location exists
    if (!mongoose_1.default.Types.ObjectId.isValid(serviceLocation)) {
        res.status(400);
        throw new Error("Invalid service location ID");
    }
    const branch = await Branch_1.default.findById(serviceLocation);
    if (!branch) {
        res.status(404);
        throw new Error("Service location not found");
    }
    // Validate appointment date is in the future
    const appointmentDateTime = new Date(appointmentDate);
    if (appointmentDateTime <= new Date()) {
        res.status(400);
        throw new Error("Appointment date must be in the future");
    }
    // Check for appointment slot availability (basic check)
    const existingBooking = await ServiceBooking_1.default.findOne({
        serviceLocation,
        appointmentDate: appointmentDateTime,
        appointmentTime,
        status: { $in: ["pending", "confirmed", "in-progress"] },
    });
    if (existingBooking) {
        res.status(409);
        throw new Error("Time slot is already booked. Please choose another time.");
    }
    // Create the service booking
    const serviceBooking = await ServiceBooking_1.default.create({
        bikeModel,
        year: parseInt(year),
        vin: vin || undefined,
        mileage: parseInt(mileage),
        registrationNumber: registrationNumber || undefined,
        serviceType,
        additionalServices: additionalServices || [],
        serviceLocation,
        appointmentDate: appointmentDateTime,
        appointmentTime,
        customerName: {
            firstName,
            lastName,
        },
        contactInfo: {
            email: email.toLowerCase(),
            phone,
        },
        specialRequests: specialRequests || undefined,
        serviceOptions: {
            isDropOff: isDropOff || false,
            willWaitOnsite: willWaitOnsite || false,
        },
        branch: serviceLocation, // Assuming service location is the branch
        termsAccepted: true,
        termsAcceptedAt: new Date(),
    });
    // Populate the service location details
    await serviceBooking.populate("serviceLocation", "name address phone email");
    logger_1.default.info(`Service booking created: ${serviceBooking.bookingId} for ${firstName} ${lastName}`);
    res.status(201).json({
        success: true,
        message: "Service booking created successfully",
        data: {
            bookingId: serviceBooking.bookingId,
            appointmentDateTime: serviceBooking.appointmentDateTime,
            serviceLocation: serviceBooking.serviceLocation,
            estimatedCost: serviceBooking.estimatedCost,
            serviceType: serviceBooking.serviceType,
        },
    });
});
/**
 * @desc    Get all service bookings with filtering and pagination
 * @route   GET /api/service-bookings
 * @access  Private (Admin only)
 */
exports.getServiceBookings = (0, express_async_handler_1.default)(async (req, res) => {
    const { status, serviceLocation, startDate, endDate, serviceType, page = 1, limit = 10, sortBy = "appointmentDate", sortOrder = "asc", } = req.query;
    // Build query
    const query = {};
    // For Branch Managers, restrict to their branch only
    if (req.user && (0, user_types_1.isBranchManager)(req.user)) {
        const userBranch = (0, user_types_1.getUserBranch)(req.user);
        if (userBranch) {
            query.branch = userBranch;
        }
    }
    if (status) {
        query.status = status;
    }
    if (serviceLocation) {
        if (!mongoose_1.default.Types.ObjectId.isValid(serviceLocation)) {
            res.status(400);
            throw new Error("Invalid service location ID");
        }
        // Check if user can access this service location
        if (req.user && !(0, user_types_1.canAccessBranch)(req.user, serviceLocation)) {
            res.status(403);
            throw new Error("Access denied to this service location");
        }
        query.serviceLocation = serviceLocation;
    }
    if (serviceType) {
        query.serviceType = serviceType;
    }
    // Date range filter
    if (startDate || endDate) {
        query.appointmentDate = {};
        if (startDate) {
            query.appointmentDate.$gte = new Date(startDate);
        }
        if (endDate) {
            query.appointmentDate.$lte = new Date(endDate);
        }
    }
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    // Execute query
    const total = await ServiceBooking_1.default.countDocuments(query);
    const bookings = await ServiceBooking_1.default.find(query)
        .populate("serviceLocation", "name address phone")
        .populate("branch", "name")
        .sort(sort)
        .limit(limitNum)
        .skip(skip);
    res.status(200).json({
        success: true,
        count: bookings.length,
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        data: bookings,
    });
});
/**
 * @desc    Get a single service booking by ID
 * @route   GET /api/service-bookings/:id
 * @access  Private (Admin) or Public (with booking ID)
 */
exports.getServiceBookingById = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    let booking;
    // Check if it's a MongoDB ObjectId or booking ID
    if (mongoose_1.default.Types.ObjectId.isValid(id)) {
        booking = await ServiceBooking_1.default.findById(id);
    }
    else {
        // Search by booking ID (e.g., SB-20241201-0001)
        booking = await ServiceBooking_1.default.findOne({ bookingId: id });
    }
    if (!booking) {
        res.status(404);
        throw new Error("Service booking not found");
    }
    // Check access permissions for authenticated users
    if (req.user) {
        if ((0, user_types_1.isBranchManager)(req.user)) {
            const userBranch = (0, user_types_1.getUserBranch)(req.user);
            if (userBranch && booking.branch.toString() !== userBranch.toString()) {
                res.status(403);
                throw new Error("Access denied to this booking");
            }
        }
    }
    // Populate related data
    await booking.populate([
        { path: "serviceLocation", select: "name address phone email hours" },
        { path: "branch", select: "name address phone email" },
    ]);
    res.status(200).json({
        success: true,
        data: booking,
    });
});
/**
 * @desc    Update service booking status
 * @route   PUT /api/service-bookings/:id/status
 * @access  Private (Admin only)
 */
exports.updateBookingStatus = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { status, assignedTechnician, serviceNotes, estimatedCost, actualCost, } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid booking ID");
    }
    const booking = await ServiceBooking_1.default.findById(id);
    if (!booking) {
        res.status(404);
        throw new Error("Service booking not found");
    }
    // Check access permissions
    if (req.user && (0, user_types_1.isBranchManager)(req.user)) {
        const userBranch = (0, user_types_1.getUserBranch)(req.user);
        if (userBranch && booking.branch.toString() !== userBranch.toString()) {
            res.status(403);
            throw new Error("Access denied to this booking");
        }
    }
    // Validate status transition
    const validStatuses = [
        "pending",
        "confirmed",
        "in-progress",
        "completed",
        "cancelled",
    ];
    if (status && !validStatuses.includes(status)) {
        res.status(400);
        throw new Error("Invalid status");
    }
    // Update fields
    if (status)
        booking.status = status;
    if (assignedTechnician)
        booking.assignedTechnician = assignedTechnician;
    if (serviceNotes)
        booking.serviceNotes = serviceNotes;
    if (estimatedCost)
        booking.estimatedCost = estimatedCost;
    if (actualCost)
        booking.actualCost = actualCost;
    await booking.save();
    const userRole = req.user ? (0, user_types_1.getUserRole)(req.user) : "system";
    logger_1.default.info(`Service booking ${booking.bookingId} status updated to ${status} by ${userRole}`);
    res.status(200).json({
        success: true,
        message: "Booking status updated successfully",
        data: {
            bookingId: booking.bookingId,
            status: booking.status,
            updatedAt: booking.updatedAt,
        },
    });
});
/**
 * @desc    Cancel a service booking
 * @route   PUT /api/service-bookings/:id/cancel
 * @access  Public (with booking ID) or Private (Admin)
 */
exports.cancelServiceBooking = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { reason, email } = req.body;
    let booking;
    // Find booking by ID or booking ID
    if (mongoose_1.default.Types.ObjectId.isValid(id)) {
        booking = await ServiceBooking_1.default.findById(id);
    }
    else {
        booking = await ServiceBooking_1.default.findOne({ bookingId: id });
    }
    if (!booking) {
        res.status(404);
        throw new Error("Service booking not found");
    }
    // If not admin request, verify email matches
    if (!req.user && email !== booking.contactInfo.email) {
        res.status(403);
        throw new Error("Unauthorized to cancel this booking");
    }
    // For Branch Managers, check if they can access this booking
    if (req.user && (0, user_types_1.isBranchManager)(req.user)) {
        const userBranch = (0, user_types_1.getUserBranch)(req.user);
        if (userBranch && booking.branch.toString() !== userBranch.toString()) {
            res.status(403);
            throw new Error("Access denied to this booking");
        }
    }
    // Check if booking can be cancelled
    if (booking.status === "completed") {
        res.status(400);
        throw new Error("Cannot cancel a completed booking");
    }
    if (booking.status === "cancelled") {
        res.status(400);
        throw new Error("Booking is already cancelled");
    }
    // Cancel the booking directly
    booking.status = "cancelled";
    if (reason) {
        booking.internalNotes = `${booking.internalNotes || ""}\nCancelled: ${reason}`;
    }
    await booking.save();
    logger_1.default.info(`Service booking ${booking.bookingId} cancelled. Reason: ${reason || "Not specified"}`);
    res.status(200).json({
        success: true,
        message: "Service booking cancelled successfully",
        data: {
            bookingId: booking.bookingId,
            status: booking.status,
            cancelledAt: booking.updatedAt,
        },
    });
});
/**
 * @desc    Get upcoming appointments for a branch
 * @route   GET /api/service-bookings/branch/:branchId/upcoming
 * @access  Private (Branch Admin or Super Admin)
 */
exports.getBranchUpcomingAppointments = (0, express_async_handler_1.default)(async (req, res) => {
    const { branchId } = req.params;
    const { days = 7 } = req.query;
    if (!mongoose_1.default.Types.ObjectId.isValid(branchId)) {
        res.status(400);
        throw new Error("Invalid branch ID");
    }
    // Check access permissions
    if (req.user && !(0, user_types_1.canAccessBranch)(req.user, branchId)) {
        res.status(403);
        throw new Error("Access denied to this branch data");
    }
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days));
    const appointments = await ServiceBooking_1.default.find({
        branch: branchId,
        appointmentDate: {
            $gte: today,
            $lte: futureDate,
        },
        status: { $in: ["pending", "confirmed", "in-progress"] },
    })
        .populate("serviceLocation", "name")
        .sort({ appointmentDate: 1, appointmentTime: 1 });
    res.status(200).json({
        success: true,
        count: appointments.length,
        data: appointments,
    });
});
/**
 * @desc    Get booking statistics for dashboard
 * @route   GET /api/service-bookings/stats
 * @access  Private (Admin only)
 */
exports.getBookingStats = (0, express_async_handler_1.default)(async (req, res) => {
    const { branchId, startDate, endDate } = req.query;
    // Build base query
    const baseQuery = {};
    // For Branch Managers, restrict to their branch
    if (req.user && (0, user_types_1.isBranchManager)(req.user)) {
        const userBranch = (0, user_types_1.getUserBranch)(req.user);
        if (userBranch) {
            baseQuery.branch = userBranch;
        }
    }
    else if (branchId) {
        // For Super Admins, allow filtering by branch
        if (!mongoose_1.default.Types.ObjectId.isValid(branchId)) {
            res.status(400);
            throw new Error("Invalid branch ID");
        }
        baseQuery.branch = branchId;
    }
    // Date range filter
    if (startDate || endDate) {
        baseQuery.createdAt = {};
        if (startDate) {
            baseQuery.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            baseQuery.createdAt.$lte = new Date(endDate);
        }
    }
    // Get various statistics
    const [totalBookings, statusStats, serviceTypeStats, revenueStats, monthlyTrend,] = await Promise.all([
        // Total bookings
        ServiceBooking_1.default.countDocuments(baseQuery),
        // Bookings by status
        ServiceBooking_1.default.aggregate([
            { $match: baseQuery },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        // Bookings by service type
        ServiceBooking_1.default.aggregate([
            { $match: baseQuery },
            { $group: { _id: "$serviceType", count: { $sum: 1 } } },
        ]),
        // Revenue statistics
        ServiceBooking_1.default.aggregate([
            { $match: { ...baseQuery, actualCost: { $exists: true } } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$actualCost" },
                    averageBookingValue: { $avg: "$actualCost" },
                    completedBookings: { $sum: 1 },
                },
            },
        ]),
        // Monthly trend
        ServiceBooking_1.default.aggregate([
            { $match: baseQuery },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: { $ifNull: ["$actualCost", 0] } },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),
    ]);
    res.status(200).json({
        success: true,
        data: {
            totalBookings,
            statusDistribution: statusStats,
            serviceTypeDistribution: serviceTypeStats,
            revenue: revenueStats[0] || {
                totalRevenue: 0,
                averageBookingValue: 0,
                completedBookings: 0,
            },
            monthlyTrend,
        },
    });
});
/**
 * @desc    Check time slot availability
 * @route   GET /api/service-bookings/availability
 * @access  Public
 */
exports.checkTimeSlotAvailability = (0, express_async_handler_1.default)(async (req, res) => {
    const { serviceLocation, date } = req.query;
    if (!serviceLocation || !date) {
        res.status(400);
        throw new Error("Service location and date are required");
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(serviceLocation)) {
        res.status(400);
        throw new Error("Invalid service location ID");
    }
    const appointmentDate = new Date(date);
    if (appointmentDate <= new Date()) {
        res.status(400);
        throw new Error("Date must be in the future");
    }
    // Get all booked time slots for the date and location
    const bookedSlots = await ServiceBooking_1.default.find({
        serviceLocation,
        appointmentDate,
        status: { $in: ["pending", "confirmed", "in-progress"] },
    }).select("appointmentTime");
    // Available time slots (you can make this configurable)
    const allTimeSlots = [
        "9:00 AM",
        "10:00 AM",
        "11:00 AM",
        "12:00 PM",
        "1:00 PM",
        "2:00 PM",
        "3:00 PM",
        "4:00 PM",
        "5:00 PM",
    ];
    const bookedTimes = bookedSlots.map((booking) => booking.appointmentTime);
    const availableSlots = allTimeSlots.filter((slot) => !bookedTimes.includes(slot));
    res.status(200).json({
        success: true,
        data: {
            date: appointmentDate.toDateString(),
            availableSlots,
            bookedSlots: bookedTimes,
            totalAvailable: availableSlots.length,
        },
    });
});
