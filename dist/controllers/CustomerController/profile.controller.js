"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerById = exports.getAllCustomers = exports.updateCustomerProfile = exports.getCustomerProfile = exports.createProfile = void 0;
const CustomerProfile_1 = require("../../models/CustomerSystem/CustomerProfile");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const logger_1 = __importDefault(require("../../utils/logger"));
const BaseCustomer_1 = require("../../models/CustomerSystem/BaseCustomer");
/**
 * @desc    Create customer profile
 * @route   POST /api/customer/profile
 * @access  Private (Customer)
 */
exports.createProfile = (0, express_async_handler_1.default)(async (req, res) => {
    const { firstName, middleName, lastName, email, village, postOffice, policeStation, district, state, bloodGroup, familyNumber1, familyNumber2, } = req.body;
    if (!req.customer) {
        res.status(401);
        throw new Error("Customer authentication required");
    }
    // Check if profile already exists
    const existingProfile = await CustomerProfile_1.CustomerProfileModel.findOne({
        customer: req.customer._id,
    });
    if (existingProfile) {
        res.status(400);
        throw new Error("Profile already exists. Use update endpoint instead.");
    }
    // Create new profile
    const profile = await CustomerProfile_1.CustomerProfileModel.create({
        customer: req.customer._id,
        firstName,
        middleName,
        lastName,
        email,
        village,
        postOffice,
        policeStation,
        district,
        state,
        bloodGroup,
        familyNumber1,
        familyNumber2,
        profileCompleted: true,
    });
    logger_1.default.info(`Profile created for customer: ${req.customer.phoneNumber}`);
    res.status(201).json({
        success: true,
        message: "Profile created successfully",
        data: {
            customer: req.customer,
            profile,
        },
    });
});
/**
 * @desc    Get customer profile with base data
 * @route   GET /api/customer/profile
 * @access  Private (Customer)
 */
exports.getCustomerProfile = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.customer) {
        res.status(401);
        throw new Error("Customer authentication required");
    }
    // Get profile if exists
    const profile = await CustomerProfile_1.CustomerProfileModel.findOne({
        customer: req.customer._id,
    });
    const responseData = {
        ...req.customer.toObject(),
        profile: profile || null,
        profileCompleted: !!(profile === null || profile === void 0 ? void 0 : profile.profileCompleted),
    };
    res.status(200).json({
        success: true,
        data: responseData,
    });
});
/**
 * @desc    Update customer profile
 * @route   PUT /api/customer/profile
 * @access  Private (Customer)
 */
exports.updateCustomerProfile = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.customer) {
        res.status(401);
        throw new Error("Customer authentication required");
    }
    const allowedUpdates = [
        "firstName",
        "middleName",
        "lastName",
        "email",
        "village",
        "postOffice",
        "policeStation",
        "district",
        "state",
        "bloodGroup",
        "familyNumber1",
        "familyNumber2",
    ];
    const updates = {};
    Object.keys(req.body)
        .filter((key) => allowedUpdates.includes(key))
        .forEach((key) => {
        updates[key] = req.body[key];
    });
    let profile = await CustomerProfile_1.CustomerProfileModel.findOne({
        customer: req.customer._id,
    });
    if (!profile) {
        // Create profile if it doesn't exist
        profile = await CustomerProfile_1.CustomerProfileModel.create({
            customer: req.customer._id,
            ...updates,
            profileCompleted: true,
        });
    }
    else {
        // Update existing profile
        Object.assign(profile, updates);
        profile.profileCompleted = true;
        await profile.save();
    }
    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: { profile },
    });
});
/**
 * @desc    Get all customers with profiles
 * @route   GET /api/customers
 * @access  Private (Admin)
 */
exports.getAllCustomers = (0, express_async_handler_1.default)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    // Build filter for base customers
    const filter = {};
    if (req.query.isVerified !== undefined) {
        filter.isVerified = req.query.isVerified === "true";
    }
    const customers = await BaseCustomer_1.BaseCustomerModel.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    // Get profiles for these customers
    const customerIds = customers.map((c) => c._id);
    const profiles = await CustomerProfile_1.CustomerProfileModel.find({
        customer: { $in: customerIds },
    });
    // Combine data
    const customersWithProfiles = customers.map((customer) => {
        const profile = profiles.find((p) => p.customer.toString() === customer._id.toString());
        return {
            ...customer.toObject(),
            profile: profile || null,
            profileCompleted: !!(profile === null || profile === void 0 ? void 0 : profile.profileCompleted),
        };
    });
    const total = await BaseCustomer_1.BaseCustomerModel.countDocuments(filter);
    res.status(200).json({
        success: true,
        data: customersWithProfiles,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
});
/**
 * @desc    Get customer by ID with profile
 * @route   GET /api/customers/:id
 * @access  Private (Admin/Customer)
 */
exports.getCustomerById = (0, express_async_handler_1.default)(async (req, res) => {
    const customer = await BaseCustomer_1.BaseCustomerModel.findById(req.params.id || req.params.customerId);
    if (!customer) {
        res.status(404);
        throw new Error("Customer not found");
    }
    const profile = await CustomerProfile_1.CustomerProfileModel.findOne({
        customer: customer._id,
    });
    const responseData = {
        ...customer.toObject(),
        profile: profile || null,
        profileCompleted: !!(profile === null || profile === void 0 ? void 0 : profile.profileCompleted),
    };
    res.status(200).json({
        success: true,
        data: responseData,
    });
});
