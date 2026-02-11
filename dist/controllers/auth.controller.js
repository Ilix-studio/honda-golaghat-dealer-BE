"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBranchManagers = exports.deleteBranchM = exports.createBranchM = exports.logoutSuperAdmin = exports.loginSuperAdmin = void 0;
// auth.controller.ts
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Admin_1 = __importDefault(require("../models/Admin"));
const logger_1 = __importDefault(require("../utils/logger"));
const dotenv_1 = __importDefault(require("dotenv"));
const BranchManager_1 = __importDefault(require("../models/BranchManager"));
const Branch_1 = __importDefault(require("../models/Branch"));
const mongoose_1 = __importDefault(require("mongoose"));
const generateID_1 = require("../utils/generateID");
const user_types_1 = require("../types/user.types");
dotenv_1.default.config();
/**
 * @desc    Login Super-Admin and generate token
 * @route   POST /api/adminLogin/super-ad-login
 * @access  Public
 */
exports.loginSuperAdmin = (0, express_async_handler_1.default)(async (req, res, next) => {
    const { email, password } = req.body;
    // Validate input
    if (!email || !password) {
        res.status(400).json({
            success: false,
            message: "Please provide both email and password",
        });
        return;
    }
    // Find admin by email
    const admin = await Admin_1.default.findOne({ email }).select("+password");
    // Check if admin exists and password matches
    if (!admin || !(await admin.matchPassword(password))) {
        logger_1.default.info(`Failed login attempt for email: ${email}`);
        res.status(401).json({
            success: false,
            message: "Invalid credentials",
        });
        return;
    }
    // Generate token
    const token = admin.getSignedJwtToken();
    // Log successful login
    logger_1.default.info(`Admin logged in: ${admin.email}`);
    // Return success with token
    res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            token,
        },
    });
});
/**
 * @desc    Logout Super-Admin
 * @route   POST /api/adminLogin/super-ad-logout
 * @access  Private
 */
exports.logoutSuperAdmin = (0, express_async_handler_1.default)(async (req, res, next) => {
    try {
        // Get user from req (set by protect middleware)
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: "No user found, already logged out",
            });
            return;
        }
        // Log the logout action
        logger_1.default.info(`Admin logged out: ${user.email || user.id}`);
        // Set secure headers to clear any cookies if you're using them
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        res.status(200).json({
            success: true,
            message: "Logout successful",
            data: {
                loggedOutAt: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.default.error("Logout error:", error);
        res.status(500).json({
            success: false,
            message: "Error during logout",
        });
    }
});
/**
 * @desc    Create Branch Manager
 * @route   POST /api/adminLogin/create-branchM
 * @access  Private (Super-Admin only)
 */
exports.createBranchM = (0, express_async_handler_1.default)(async (req, res) => {
    const { branch } = req.body;
    // Validate required fields
    if (!branch) {
        res.status(400);
        throw new Error("Please provide branch ID");
    }
    // Validate branch exists
    if (!mongoose_1.default.Types.ObjectId.isValid(branch)) {
        res.status(400);
        throw new Error("Invalid branch ID");
    }
    const branchExists = await Branch_1.default.findById(branch);
    if (!branchExists) {
        res.status(404);
        throw new Error("Branch not found. Please create a branch first before creating a branch manager.");
    }
    // Generate application ID and password
    const applicationId = (0, generateID_1.generateApplicationId)();
    const password = (0, generateID_1.generateRandomPassword)();
    // Ensure req.user exists and is admin
    if (!req.user || !(0, user_types_1.isAdmin)(req.user)) {
        res.status(403);
        throw new Error("Only Super-Admin can create branch managers");
    }
    // Create branch manager
    const branchManager = await BranchManager_1.default.create({
        applicationId,
        password,
        branch,
        createdBy: req.user._id,
    });
    // Log creation
    logger_1.default.info(`Branch manager created for branch: ${branchExists.branchName}`);
    // Return success response with credentials
    res.status(201).json({
        success: true,
        message: "Branch manager created successfully",
        data: {
            applicationId: branchManager.applicationId,
            password: password, // Only returned once at creation
            branch: branchExists.branchName,
        },
    });
});
/**
 * @desc    Delete Branch Manager
 * @route   DELETE /api/adminLogin/del-branchM/:id
 * @access  Private (Super-Admin only)
 */
exports.deleteBranchM = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid branch manager ID");
    }
    const branchManager = await BranchManager_1.default.findById(id);
    if (!branchManager) {
        res.status(404);
        throw new Error("Branch manager not found");
    }
    // Get branch details for logging
    const branch = await Branch_1.default.findById(branchManager.branch);
    // Delete the branch manager
    await BranchManager_1.default.findByIdAndDelete(id);
    logger_1.default.info(`Branch manager deleted from branch: ${(branch === null || branch === void 0 ? void 0 : branch.branchName) || "Unknown"}`);
    res.status(200).json({
        success: true,
        message: "Branch manager deleted successfully",
    });
});
/**
 * @desc    Get all branch managers
 * @route   GET /api/adminLogin/branch-managers
 * @access  Private (Super-Admin only)
 */
exports.getAllBranchManagers = (0, express_async_handler_1.default)(async (req, res) => {
    const branchManagers = await BranchManager_1.default.find()
        .populate("branch", "name address")
        .populate("createdBy", "name email");
    res.status(200).json({
        success: true,
        count: branchManagers.length,
        data: branchManagers,
    });
});
