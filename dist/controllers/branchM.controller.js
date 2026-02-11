"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutBranchM = exports.loginBranchM = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const BranchManager_1 = __importDefault(require("../models/BranchManager"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * @desc    Login Branch Manager
 * @route   POST /api/adminLogin/branchM-login
 * @access  Public
 */
exports.loginBranchM = (0, express_async_handler_1.default)(async (req, res) => {
    const { applicationId, password } = req.body;
    // Validate input
    if (!applicationId || !password) {
        res.status(400).json({
            success: false,
            message: "Please provide both application ID and password",
        });
        return;
    }
    // Find branch manager by application ID
    const branchManager = await BranchManager_1.default.findOne({ applicationId }).select("+password");
    // Check if branch manager exists and password matches
    if (!branchManager || !(await branchManager.matchPassword(password))) {
        logger_1.default.info(`Failed login attempt for application ID: ${applicationId}`);
        res.status(401).json({
            success: false,
            message: "Invalid credentials",
        });
        return;
    }
    // Populate branch details
    await branchManager.populate("branch", "name address");
    // Generate token
    const token = branchManager.getSignedJwtToken();
    // Log successful login
    logger_1.default.info(`Branch manager logged in: ${branchManager.applicationId}`);
    // Return success with token
    res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            id: branchManager._id,
            applicationId: branchManager.applicationId,
            branch: branchManager.branch,
            role: "Branch-Admin",
            token,
        },
    });
});
/**
 * @desc    Logout Branch Manager
 * @route   POST /api/adminLogin/branchM-logout
 * @access  Private
 */
exports.logoutBranchM = (0, express_async_handler_1.default)(async (req, res) => {
    res.status(200).json({
        success: true,
        message: "Logout successful",
    });
});
