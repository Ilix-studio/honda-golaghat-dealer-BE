import asyncHandler from "express-async-handler";
import { Request, Response } from "express";

import Branch from "../models/Branch";
import mongoose from "mongoose";
import logger from "../utils/logger";
import {
  isAdmin,
  isBranchManager,
  getUserRole,
  getUserBranch,
  canAccessBranch,
} from "../types/user.types";
import { ServiceBooking } from "../models/CustomerSystem/ServiceBooking";

/**
 * @desc    Create a new service booking
 * @route   POST /api/service-bookings
 * @access  Public
 */
export const createServiceBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      motorcyclemodelName, // Fixed: was bikeModel
      vehicleAge, // Fixed: was year
      mileage,
      rtoCode, // Fixed: was registrationNumber
      serviceType,
      additionalServices,
      branchName, // Fixed: was serviceLocation
      appointmentDate,
      appointmentTime,
      firstName,
      lastName,
      email,
      phone,
      specialRequests,
      isDropOff,
      willWaitOnsite,
      termsAccepted,
    } = req.body;

    // Validate required fields
    if (
      !motorcyclemodelName ||
      !vehicleAge ||
      !mileage ||
      !serviceType ||
      !branchName ||
      !appointmentDate ||
      !appointmentTime ||
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !termsAccepted
    ) {
      res.status(400);
      throw new Error("Please provide all required fields");
    }

    // Validate branch exists
    if (!mongoose.Types.ObjectId.isValid(branchName)) {
      res.status(400);
      throw new Error("Invalid branch ID");
    }

    const branch = await Branch.findById(branchName);
    if (!branch) {
      res.status(404);
      throw new Error("Branch not found");
    }

    // Validate appointment date is in the future
    const appointmentDateTime = new Date(appointmentDate);
    if (appointmentDateTime <= new Date()) {
      res.status(400);
      throw new Error("Appointment date must be in the future");
    }

    // Check for appointment slot availability (basic check)
    const existingBooking = await ServiceBooking.findOne({
      branchName,
      appointmentDate: appointmentDateTime,
      appointmentTime,
      status: { $in: ["pending", "confirmed", "in-progress"] },
    });

    if (existingBooking) {
      res.status(409);
      throw new Error(
        "Time slot is already booked. Please choose another time."
      );
    }

    // Create the service booking
    const serviceBooking = await ServiceBooking.create({
      motorcyclemodelName,
      vehicleAge,
      mileage: parseInt(mileage),
      rtoCode,
      serviceType,
      additionalServices: additionalServices || [],
      branchName,
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
      branch: branchName, // branch reference
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    });

    // Populate the branch details
    await serviceBooking.populate("branchName", "name address phone email");

    logger.info(
      `Service booking created: ${serviceBooking.bookingId} for ${firstName} ${lastName}`
    );

    res.status(201).json({
      success: true,
      message: "Service booking created successfully",
      data: {
        bookingId: serviceBooking.bookingId,
        appointmentDateTime: serviceBooking.appointmentDateTime,
        branchName: serviceBooking.branchName,
        estimatedCost: serviceBooking.estimatedCost,
        serviceType: serviceBooking.serviceType,
      },
    });
  }
);

/**
 * @desc    Get all service bookings with filtering and pagination
 * @route   GET /api/service-bookings
 * @access  Private (Admin only)
 */
export const getServiceBookings = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      status,
      branchName, // Fixed: was serviceLocation
      startDate,
      endDate,
      serviceType,
      page = 1,
      limit = 10,
      sortBy = "appointmentDate",
      sortOrder = "asc",
    } = req.query;

    // Build query
    const query: any = {};

    // For Branch Managers, restrict to their branch only
    if (req.user && isBranchManager(req.user)) {
      const userBranch = getUserBranch(req.user);
      if (userBranch) {
        query.branch = userBranch;
      }
    }

    if (status) {
      query.status = status;
    }

    if (branchName) {
      if (!mongoose.Types.ObjectId.isValid(branchName as string)) {
        res.status(400);
        throw new Error("Invalid branch ID");
      }

      // Check if user can access this branch
      if (req.user && !canAccessBranch(req.user, branchName as string)) {
        res.status(403);
        throw new Error("Access denied to this branch");
      }

      query.branchName = branchName;
    }

    if (serviceType) {
      query.serviceType = serviceType;
    }

    // Date range filter
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) {
        query.appointmentDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.appointmentDate.$lte = new Date(endDate as string);
      }
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sort: any = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const total = await ServiceBooking.countDocuments(query);
    const bookings = await ServiceBooking.find(query)
      .populate("branchName", "name address phone")
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
  }
);

/**
 * @desc    Get a single service booking by ID
 * @route   GET /api/service-bookings/:id
 * @access  Private (Admin) or Public (with booking ID)
 */
export const getServiceBookingById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    let booking;

    // Check if it's a MongoDB ObjectId or booking ID
    if (mongoose.Types.ObjectId.isValid(id)) {
      booking = await ServiceBooking.findById(id);
    } else {
      // Search by booking ID (e.g., SB-20241201-0001)
      booking = await ServiceBooking.findOne({ bookingId: id });
    }

    if (!booking) {
      res.status(404);
      throw new Error("Service booking not found");
    }

    // Check access permissions for authenticated users
    if (req.user) {
      if (isBranchManager(req.user)) {
        const userBranch = getUserBranch(req.user);
        if (userBranch && booking.branch.toString() !== userBranch.toString()) {
          res.status(403);
          throw new Error("Access denied to this booking");
        }
      }
    }

    // Populate related data
    await booking.populate([
      { path: "branchName", select: "name address phone email hours" },
      { path: "branch", select: "name address phone email" },
    ]);

    res.status(200).json({
      success: true,
      data: booking,
    });
  }
);

/**
 * @desc    Update service booking status
 * @route   PUT /api/service-bookings/:id/status
 * @access  Private (Admin only)
 */
export const updateBookingStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      status,
      // Removed assignedTechnician, serviceNotes as they are commented out in model
      estimatedCost,
      actualCost,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid booking ID");
    }

    const booking = await ServiceBooking.findById(id);
    if (!booking) {
      res.status(404);
      throw new Error("Service booking not found");
    }

    // Check access permissions
    if (req.user && isBranchManager(req.user)) {
      const userBranch = getUserBranch(req.user);
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
    if (status) booking.status = status;
    if (estimatedCost) booking.estimatedCost = estimatedCost;
    if (actualCost) booking.actualCost = actualCost;

    await booking.save();

    const userRole = req.user ? getUserRole(req.user) : "system";
    logger.info(
      `Service booking ${booking.bookingId} status updated to ${status} by ${userRole}`
    );

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: {
        bookingId: booking.bookingId,
        status: booking.status,
        updatedAt: booking.updatedAt,
      },
    });
  }
);

/**
 * @desc    Cancel a service booking
 * @route   PUT /api/service-bookings/:id/cancel
 * @access  Public (with booking ID) or Private (Admin)
 */
export const cancelServiceBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason, email } = req.body;

    let booking;

    // Find booking by ID or booking ID
    if (mongoose.Types.ObjectId.isValid(id)) {
      booking = await ServiceBooking.findById(id);
    } else {
      booking = await ServiceBooking.findOne({ bookingId: id });
    }

    if (!booking) {
      res.status(404);
      throw new Error("Service booking not found");
    }

    // For Branch Managers, check if they can access this booking
    if (req.user && isBranchManager(req.user)) {
      const userBranch = getUserBranch(req.user);
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

    // Cancel the booking using the instance method
    await booking.cancelBooking(reason);

    logger.info(
      `Service booking ${booking.bookingId} cancelled. Reason: ${
        reason || "Not specified"
      }`
    );

    res.status(200).json({
      success: true,
      message: "Service booking cancelled successfully",
      data: {
        bookingId: booking.bookingId,
        status: booking.status,
        cancelledAt: booking.updatedAt,
      },
    });
  }
);

/**
 * @desc    Get upcoming appointments for a branch
 * @route   GET /api/service-bookings/branch/:branchId/upcoming
 * @access  Private (Branch Admin or Super Admin)
 */
export const getBranchUpcomingAppointments = asyncHandler(
  async (req: Request, res: Response) => {
    const { branchId } = req.params;
    const { days = 7 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      res.status(400);
      throw new Error("Invalid branch ID");
    }

    // Check access permissions
    if (req.user && !canAccessBranch(req.user, branchId)) {
      res.status(403);
      throw new Error("Access denied to this branch data");
    }

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days as string));

    const appointments = await ServiceBooking.find({
      branch: branchId,
      appointmentDate: {
        $gte: today,
        $lte: futureDate,
      },
      status: { $in: ["pending", "confirmed", "in-progress"] },
    })
      .populate("branchName", "name")
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  }
);

/**
 * @desc    Get booking statistics for dashboard
 * @route   GET /api/service-bookings/stats
 * @access  Private (Admin only)
 */
export const getBookingStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { branchId, startDate, endDate } = req.query;

    // Build base query
    const baseQuery: any = {};

    // For Branch Managers, restrict to their branch
    if (req.user && isBranchManager(req.user)) {
      const userBranch = getUserBranch(req.user);
      if (userBranch) {
        baseQuery.branch = userBranch;
      }
    } else if (branchId) {
      // For Super Admins, allow filtering by branch
      if (!mongoose.Types.ObjectId.isValid(branchId as string)) {
        res.status(400);
        throw new Error("Invalid branch ID");
      }
      baseQuery.branch = branchId;
    }

    // Date range filter
    if (startDate || endDate) {
      baseQuery.createdAt = {};
      if (startDate) {
        baseQuery.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        baseQuery.createdAt.$lte = new Date(endDate as string);
      }
    }

    // Get various statistics
    const [
      totalBookings,
      statusStats,
      serviceTypeStats,
      revenueStats,
      monthlyTrend,
    ] = await Promise.all([
      // Total bookings
      ServiceBooking.countDocuments(baseQuery),

      // Bookings by status
      ServiceBooking.aggregate([
        { $match: baseQuery },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Bookings by service type
      ServiceBooking.aggregate([
        { $match: baseQuery },
        { $group: { _id: "$serviceType", count: { $sum: 1 } } },
      ]),

      // Revenue statistics
      ServiceBooking.aggregate([
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
      ServiceBooking.aggregate([
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
  }
);

/**
 * @desc    Check time slot availability
 * @route   GET /api/service-bookings/availability
 * @access  Public
 */
export const checkTimeSlotAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const { branchName, date } = req.query; // Fixed: was serviceLocation

    if (!branchName) {
      res.status(400);
      throw new Error("Branch and date are required");
    }

    if (!mongoose.Types.ObjectId.isValid(branchName as string)) {
      res.status(400);
      throw new Error("Invalid branch ID");
    }

    const appointmentDate = new Date(date as string);
    if (appointmentDate <= new Date()) {
      res.status(400);
      throw new Error("Date must be in the future");
    }

    // Get all booked time slots for the date and branch
    const bookedSlots = await ServiceBooking.find({
      branchName,
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
    const availableSlots = allTimeSlots.filter(
      (slot) => !bookedTimes.includes(slot)
    );

    res.status(200).json({
      success: true,
      data: {
        date: appointmentDate.toDateString(),
        availableSlots,
        bookedSlots: bookedTimes,
        totalAvailable: availableSlots.length,
      },
    });
  }
);
