import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import GetApproved from "../models/GetApproved";
import mongoose from "mongoose";
import logger from "../utils/logger";

/**
 * @desc    Submit a new GetApproved application
 * @route   POST /api/getapproved
 * @access  Public
 */
export const submitApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      firstName,
      lastName,
      email,
      phone,
      employmentType,
      monthlyIncome,
      creditScoreRange,
      branch,
      termsAccepted,
      privacyPolicyAccepted,
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !employmentType ||
      !monthlyIncome ||
      !creditScoreRange
    ) {
      res.status(400);
      throw new Error("Please provide all required fields");
    }

    // Validate terms acceptance
    if (!termsAccepted || !privacyPolicyAccepted) {
      res.status(400);
      throw new Error("Terms and Privacy Policy must be accepted");
    }

    // Check if email already exists
    const existingApplication = await GetApproved.findOne({ email });
    if (existingApplication) {
      res.status(400);
      throw new Error("An application with this email already exists");
    }

    // Validate branch if provided
    if (branch && !mongoose.Types.ObjectId.isValid(branch)) {
      res.status(400);
      throw new Error("Invalid branch ID");
    }

    // Create new application
    const application = await GetApproved.create({
      firstName,
      lastName,
      email,
      phone,
      employmentType,
      monthlyIncome,
      creditScoreRange,
      branch,
      termsAccepted,
      privacyPolicyAccepted,
    });

    logger.info(
      `New GetApproved application submitted: ${application.applicationId} by ${application.fullName}`
    );

    res.status(201).json({
      success: true,
      data: {
        applicationId: application.applicationId,
        status: application.status,
        message:
          "Application submitted successfully. You will receive a response within 24 hours.",
      },
    });
  }
);

/**
 * @desc    Get all applications with filtering and pagination
 * @route   GET /api/getapproved
 * @access  Private (Admin only)
 */
export const getAllApplications = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      status,
      employmentType,
      creditScoreRange,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query object
    const query: any = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by employment type
    if (employmentType) {
      query.employmentType = employmentType;
    }

    // Filter by credit score range
    if (creditScoreRange) {
      query.creditScoreRange = creditScoreRange;
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { applicationId: searchRegex },
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    // Get total count for pagination
    const total = await GetApproved.countDocuments(query);

    // Execute query with pagination and sorting
    const applications = await GetApproved.find(query)
      .sort(sort)
      .limit(Number(limit))
      .skip(skip)
      .populate("branch", "name address")
      .populate("reviewedBy", "name email");

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: applications,
    });
  }
);

/**
 * @desc    Get application by ID or application ID
 * @route   GET /api/getapproved/:id
 * @access  Public (can be accessed with application ID)
 */
export const getApplicationById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    let application;

    // Check if it's a MongoDB ObjectId or application ID
    if (mongoose.Types.ObjectId.isValid(id)) {
      application = await GetApproved.findById(id)
        .populate("branch", "name address")
        .populate("reviewedBy", "name email");
    } else {
      // Search by application ID
      application = await GetApproved.findOne({ applicationId: id })
        .populate("branch", "name address")
        .populate("reviewedBy", "name email");
    }

    if (!application) {
      res.status(404);
      throw new Error("Application not found");
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  }
);

/**
 * @desc    Update application status
 * @route   PUT /api/getapproved/:id/status
 * @access  Private (Admin only)
 */
export const updateApplicationStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, reviewNotes, preApprovalAmount, preApprovalValidDays } =
      req.body;

    // Validate status
    const validStatuses = [
      "pending",
      "under-review",
      "pre-approved",
      "approved",
      "rejected",
    ];
    if (!validStatuses.includes(status)) {
      res.status(400);
      throw new Error("Invalid status");
    }

    let application;

    // Find application by MongoDB ID or application ID
    if (mongoose.Types.ObjectId.isValid(id)) {
      application = await GetApproved.findById(id);
    } else {
      application = await GetApproved.findOne({ applicationId: id });
    }

    if (!application) {
      res.status(404);
      throw new Error("Application not found");
    }

    // Get reviewer ID from authenticated user
    const reviewerId = req.user?.id;

    // Update application status
    await application.updateStatus(status, reviewerId, reviewNotes);

    // Set pre-approval amount if provided and status is pre-approved
    if (status === "pre-approved" && preApprovalAmount) {
      await application.setPreApproval(
        preApprovalAmount,
        preApprovalValidDays || 30
      );
    }

    // Populate fields for response
    await application.populate("branch", "name address");
    await application.populate("reviewedBy", "name email");

    logger.info(
      `Application ${application.applicationId} status updated to ${status} by admin ${reviewerId}`
    );

    res.status(200).json({
      success: true,
      data: application,
      message: "Application status updated successfully",
    });
  }
);

/**
 * @desc    Delete an application
 * @route   DELETE /api/getapproved/:id
 * @access  Private (Super-Admin only)
 */
export const deleteApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    let application;

    // Find application by MongoDB ID or application ID
    if (mongoose.Types.ObjectId.isValid(id)) {
      application = await GetApproved.findById(id);
    } else {
      application = await GetApproved.findOne({ applicationId: id });
    }

    if (!application) {
      res.status(404);
      throw new Error("Application not found");
    }

    await GetApproved.deleteOne({ _id: application._id });

    logger.info(
      `Application ${application.applicationId} deleted by admin ${req.user?.id}`
    );

    res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  }
);

/**
 * @desc    Get application statistics
 * @route   GET /api/getapproved/stats
 * @access  Private (Admin only)
 */
export const getApplicationStats = asyncHandler(
  async (req: Request, res: Response) => {
    // Get counts by status
    const statusCounts = await GetApproved.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get counts by employment type
    const employmentTypeCounts = await GetApproved.aggregate([
      {
        $group: {
          _id: "$employmentType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get counts by credit score range
    const creditScoreCounts = await GetApproved.aggregate([
      {
        $group: {
          _id: "$creditScoreRange",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent applications (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentApplicationsCount = await GetApproved.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get average monthly income
    const avgIncome = await GetApproved.aggregate([
      {
        $group: {
          _id: null,
          averageIncome: { $avg: "$monthlyIncome" },
        },
      },
    ]);

    // Get total applications
    const totalApplications = await GetApproved.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalApplications,
        recentApplications: recentApplicationsCount,
        averageMonthlyIncome: avgIncome[0]?.averageIncome || 0,
        statusBreakdown: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        employmentTypeBreakdown: employmentTypeCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        creditScoreBreakdown: creditScoreCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  }
);

/**
 * @desc    Get applications by branch
 * @route   GET /api/getapproved/branch/:branchId
 * @access  Private (Admin only)
 */
export const getApplicationsByBranch = asyncHandler(
  async (req: Request, res: Response) => {
    const { branchId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Validate branch ID
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      res.status(400);
      throw new Error("Invalid branch ID");
    }

    // Build query
    const query: any = { branch: branchId };
    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get total count
    const total = await GetApproved.countDocuments(query);

    // Get applications
    const applications = await GetApproved.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip)
      .populate("branch", "name address")
      .populate("reviewedBy", "name email");

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: applications,
    });
  }
);

/**
 * @desc    Check application status by email and application ID
 * @route   POST /api/getapproved/check-status
 * @access  Public
 */
export const checkApplicationStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, applicationId } = req.body;

    if (!email || !applicationId) {
      res.status(400);
      throw new Error("Please provide both email and application ID");
    }

    const application = await GetApproved.findOne({ email, applicationId })
      .select(
        "applicationId status preApprovalAmount preApprovalValidUntil createdAt"
      )
      .populate("branch", "name address");

    if (!application) {
      res.status(404);
      throw new Error("Application not found");
    }

    res.status(200).json({
      success: true,
      data: {
        applicationId: application.applicationId,
        status: application.status,
        preApprovalAmount: application.preApprovalAmount,
        preApprovalValidUntil: application.preApprovalValidUntil,
        submittedAt: application.createdAt,
        branch: application.branch,
      },
    });
  }
);
