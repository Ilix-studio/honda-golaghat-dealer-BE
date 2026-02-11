"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeStaffMember = exports.updateStaffMember = exports.getStaffByBranch = exports.createStaffM = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Branch_1 = __importDefault(require("../models/Branch"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const user_types_1 = require("../types/user.types");
/**
 * @desc    Create staff member
 * @route   POST /api/admin/create-staffM
 * @access  Private (Super-Admin and Branch-Managers)
 */
exports.createStaffM = (0, express_async_handler_1.default)(async (req, res) => {
    const { branchId, name, position } = req.body;
    // Validate input
    if (!branchId || !name || !position) {
        res.status(400);
        throw new Error("Please provide branch ID, staff name, and position");
    }
    // Validate branch ID
    if (!mongoose_1.default.Types.ObjectId.isValid(branchId)) {
        res.status(400);
        throw new Error("Invalid branch ID");
    }
    // Check if branch exists
    const branch = await Branch_1.default.findById(branchId);
    if (!branch) {
        res.status(404);
        throw new Error("Branch not found");
    }
    // Ensure user exists
    if (!req.user) {
        res.status(401);
        throw new Error("User not authenticated");
    }
    // For Branch Managers, verify they can only add staff to their own branch
    if ((0, user_types_1.isBranchManager)(req.user)) {
        const userBranch = (0, user_types_1.getUserBranch)(req.user);
        if (userBranch && userBranch.toString() !== branchId) {
            res.status(403);
            throw new Error("You can only add staff to your assigned branch");
        }
    }
    // Add staff member to branch
    branch.staff.push({ name, position });
    await branch.save();
    const userRole = (0, user_types_1.getUserRole)(req.user);
    logger_1.default.info(`Staff member ${name} added to branch ${branch.name} by ${userRole}`);
    res.status(201).json({
        success: true,
        message: "Staff member added successfully",
        data: {
            name,
            position,
            branch: branch.name,
        },
    });
});
/**
 * @desc    Get all staff members for a branch
 * @route   GET /api/admin/staff/:branchId
 * @access  Private (Super-Admin or Branch-Admin)
 */
exports.getStaffByBranch = (0, express_async_handler_1.default)(async (req, res) => {
    const { branchId } = req.params;
    // Validate branch ID
    if (!mongoose_1.default.Types.ObjectId.isValid(branchId)) {
        res.status(400);
        throw new Error("Invalid branch ID");
    }
    // Find branch
    const branch = await Branch_1.default.findById(branchId);
    if (!branch) {
        res.status(404);
        throw new Error("Branch not found");
    }
    // Ensure user exists
    if (!req.user) {
        res.status(401);
        throw new Error("User not authenticated");
    }
    // For Branch Managers, verify they can only view staff from their own branch
    if ((0, user_types_1.isBranchManager)(req.user)) {
        const userBranch = (0, user_types_1.getUserBranch)(req.user);
        if (userBranch && userBranch.toString() !== branchId) {
            res.status(403);
            throw new Error("You can only view staff from your assigned branch");
        }
    }
    res.status(200).json({
        success: true,
        count: branch.staff.length,
        data: branch.staff,
    });
});
/**
 * @desc    Update staff member details
 * @route   PUT /api/admin/staff/:branchId/:staffIndex
 * @access  Private (Super-Admin or Branch-Admin)
 */
exports.updateStaffMember = (0, express_async_handler_1.default)(async (req, res) => {
    const { branchId, staffIndex } = req.params;
    const { name, position } = req.body;
    // Validate input
    if (!mongoose_1.default.Types.ObjectId.isValid(branchId)) {
        res.status(400);
        throw new Error("Invalid branch ID");
    }
    const index = parseInt(staffIndex);
    if (isNaN(index)) {
        res.status(400);
        throw new Error("Invalid staff index");
    }
    if (!name && !position) {
        res.status(400);
        throw new Error("Please provide name or position to update");
    }
    // Find branch
    const branch = await Branch_1.default.findById(branchId);
    if (!branch) {
        res.status(404);
        throw new Error("Branch not found");
    }
    // Ensure user exists
    if (!req.user) {
        res.status(401);
        throw new Error("User not authenticated");
    }
    // For Branch Managers, verify they can only manage staff in their own branch
    if ((0, user_types_1.isBranchManager)(req.user)) {
        const userBranch = (0, user_types_1.getUserBranch)(req.user);
        if (userBranch && userBranch.toString() !== branchId) {
            res.status(403);
            throw new Error("You can only manage staff in your assigned branch");
        }
    }
    // Check if staff index is valid
    if (index < 0 || index >= branch.staff.length) {
        res.status(404);
        throw new Error("Staff member not found");
    }
    // Update staff member
    if (name)
        branch.staff[index].name = name;
    if (position)
        branch.staff[index].position = position;
    await branch.save();
    const userRole = (0, user_types_1.getUserRole)(req.user);
    logger_1.default.info(`Staff member updated in branch ${branch.name} by ${userRole}`);
    res.status(200).json({
        success: true,
        message: "Staff member updated successfully",
        data: branch.staff[index],
    });
});
/**
 * @desc    Remove staff member from a branch
 * @route   DELETE /api/admin/staff/:branchId/:staffIndex
 * @access  Private (Super-Admin or Branch-Admin)
 */
exports.removeStaffMember = (0, express_async_handler_1.default)(async (req, res) => {
    const { branchId, staffIndex } = req.params;
    // Validate input
    if (!mongoose_1.default.Types.ObjectId.isValid(branchId)) {
        res.status(400);
        throw new Error("Invalid branch ID");
    }
    const index = parseInt(staffIndex);
    if (isNaN(index)) {
        res.status(400);
        throw new Error("Invalid staff index");
    }
    // Find branch
    const branch = await Branch_1.default.findById(branchId);
    if (!branch) {
        res.status(404);
        throw new Error("Branch not found");
    }
    // Ensure user exists
    if (!req.user) {
        res.status(401);
        throw new Error("User not authenticated");
    }
    // For Branch Managers, verify they can only manage staff in their own branch
    if ((0, user_types_1.isBranchManager)(req.user)) {
        const userBranch = (0, user_types_1.getUserBranch)(req.user);
        if (userBranch && userBranch.toString() !== branchId) {
            res.status(403);
            throw new Error("You can only manage staff in your assigned branch");
        }
    }
    // Check if staff index is valid
    if (index < 0 || index >= branch.staff.length) {
        res.status(404);
        throw new Error("Staff member not found");
    }
    // Store staff info for logging
    const removedStaff = branch.staff[index];
    // Remove staff member
    branch.staff.splice(index, 1);
    await branch.save();
    const userRole = (0, user_types_1.getUserRole)(req.user);
    logger_1.default.info(`Staff member ${removedStaff.name} removed from branch ${branch.name} by ${userRole}`);
    res.status(200).json({
        success: true,
        message: "Staff member removed successfully",
    });
});
