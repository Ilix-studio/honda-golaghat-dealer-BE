"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnquiryStats = exports.deleteEnquiry = exports.getEnquiryById = exports.getAllEnquiries = exports.createEnquiry = void 0;
// controllers/enquiry.controller.ts
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const EnquiryForm_1 = __importDefault(require("../models/EnquiryForm"));
/**
 * @desc    Create a new enquiry
 * @route   POST /api/enquiry-form
 * @access  Public
 */
exports.createEnquiry = (0, express_async_handler_1.default)(async (req, res) => {
    const { name, phoneNumber, address } = req.body;
    // Validate required fields
    if (!name || !phoneNumber || !address) {
        res.status(400);
        throw new Error("Please provide all required fields");
    }
    // Validate address fields
    if (!address.village ||
        !address.district ||
        !address.state ||
        !address.pinCode) {
        res.status(400);
        throw new Error("Please provide all address fields");
    }
    // Validate phone number format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
        res.status(400);
        throw new Error("Please provide a valid 10-digit phone number");
    }
    // Create new enquiry
    const enquiry = await EnquiryForm_1.default.create({
        name,
        phoneNumber,
        address,
        status: "new",
    });
    logger_1.default.info(`New enquiry submitted: ${enquiry._id} by ${enquiry.name}`);
    res.status(201).json({
        success: true,
        data: enquiry,
        message: "Enquiry submitted successfully. We will contact you shortly.",
    });
});
/**
 * @desc    Get all enquiries
 * @route   GET /api/enquiry-form
 * @access  Private (Admin only)
 */
exports.getAllEnquiries = (0, express_async_handler_1.default)(async (req, res) => {
    const { page = 1, limit = 10, status, search, sortBy = "createdAt", sortOrder = "desc", } = req.query;
    // Build query object
    const query = {};
    // Filter by status
    if (status) {
        query.status = status;
    }
    // Search functionality
    if (search) {
        const searchRegex = new RegExp(search, "i");
        query.$or = [
            { name: searchRegex },
            { phoneNumber: searchRegex },
            { "address.village": searchRegex },
            { "address.district": searchRegex },
            { "address.state": searchRegex },
            { "address.pinCode": searchRegex },
        ];
    }
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    // Get total count for pagination
    const total = await EnquiryForm_1.default.countDocuments(query);
    // Execute query with pagination and sorting
    const enquiries = await EnquiryForm_1.default.find(query)
        .sort(sort)
        .limit(Number(limit))
        .skip(skip);
    res.status(200).json({
        success: true,
        count: enquiries.length,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        data: enquiries,
    });
});
/**
 * @desc    Get enquiry by ID
 * @route   GET /api/enquiry-form/:id
 * @access  Private (Admin only)
 */
exports.getEnquiryById = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid enquiry ID");
    }
    const enquiry = await EnquiryForm_1.default.findById(id);
    if (!enquiry) {
        res.status(404);
        throw new Error("Enquiry not found");
    }
    res.status(200).json({
        success: true,
        data: enquiry,
    });
});
/**
 * @desc    Delete enquiry
 * @route   DELETE /api/enquiry-form/:id
 * @access  Private (Super-Admin only)
 */
exports.deleteEnquiry = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid enquiry ID");
    }
    const enquiry = await EnquiryForm_1.default.findById(id);
    if (!enquiry) {
        res.status(404);
        throw new Error("Enquiry not found");
    }
    await EnquiryForm_1.default.findByIdAndDelete(id);
    logger_1.default.info(`Enquiry deleted: ${id} by admin ${(_a = req.user) === null || _a === void 0 ? void 0 : _a.id}`);
    res.status(200).json({
        success: true,
        message: "Enquiry deleted successfully",
    });
});
/**
 * @desc    Get enquiry statistics
 * @route   GET /api/enquiry-form/stats
 * @access  Private (Admin only)
 */
exports.getEnquiryStats = (0, express_async_handler_1.default)(async (req, res) => {
    // Get counts by status
    const statusCounts = await EnquiryForm_1.default.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);
    // Get counts by state
    const stateCounts = await EnquiryForm_1.default.aggregate([
        {
            $group: {
                _id: "$address.state",
                count: { $sum: 1 },
            },
        },
        {
            $sort: { count: -1 },
        },
        {
            $limit: 10,
        },
    ]);
    // Get counts by district
    const districtCounts = await EnquiryForm_1.default.aggregate([
        {
            $group: {
                _id: "$address.district",
                count: { $sum: 1 },
            },
        },
        {
            $sort: { count: -1 },
        },
        {
            $limit: 10,
        },
    ]);
    // Get total enquiries
    const totalEnquiries = await EnquiryForm_1.default.countDocuments();
    // Get enquiries submitted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const enquiriesToday = await EnquiryForm_1.default.countDocuments({
        createdAt: { $gte: today },
    });
    // Get enquiries submitted in the last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const enquiriesLastWeek = await EnquiryForm_1.default.countDocuments({
        createdAt: { $gte: lastWeek },
    });
    // Get enquiries submitted in the last 30 days
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    const enquiriesLastMonth = await EnquiryForm_1.default.countDocuments({
        createdAt: { $gte: lastMonth },
    });
    res.status(200).json({
        success: true,
        data: {
            totalEnquiries,
            enquiriesToday,
            enquiriesLastWeek,
            enquiriesLastMonth,
            statusCounts: statusCounts.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            topStates: stateCounts,
            topDistricts: districtCounts,
        },
    });
});
