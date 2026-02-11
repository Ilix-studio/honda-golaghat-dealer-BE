"use strict";
// Debug version of branches.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBranch = exports.updateBranch = exports.getBranchById = exports.getBranches = exports.addBranch = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Branch_1 = __importDefault(require("../models/Branch"));
const logger_1 = __importDefault(require("../utils/logger"));
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Generate a unique branch ID from branch branchName
 */
const generateBranchId = (branchName) => {
    // Remove "Honda Motorcycles" prefix if present and convert to lowercase
    const cleanName = branchName
        .replace(/honda\s*motorcycles?\s*/i, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") // Remove special characters
        .substring(0, 20); // Limit length
    return cleanName || "branch";
};
/**
 * Check if generated ID is unique, if not append number
 */
const ensureUniqueId = async (baseId) => {
    let uniqueId = baseId;
    let counter = 1;
    while (await Branch_1.default.findOne({ id: uniqueId })) {
        uniqueId = `${baseId}${counter}`;
        counter++;
    }
    return uniqueId;
};
/**
 * @desc    Add a new branch
 * @route   POST /api/branch
 * @access  Private (Super-Admin only)
 */
exports.addBranch = (0, express_async_handler_1.default)(async (req, res) => {
    const { branchName, address, phone, email, hours } = req.body;
    // Debug individual fields
    console.log("Extracted fields:");
    console.log("branchName:", branchName);
    console.log("address:", address);
    console.log("phone:", phone);
    console.log("email:", email);
    // Validate required fields (removed 'id' from required fields)
    if (!branchName || !address || !phone || !email) {
        res.status(400);
        throw new Error("Please provide all required fields: name, address, phone, and email");
    }
    // Validate hours if provided
    if (hours && (!hours.weekdays || !hours.saturday || !hours.sunday)) {
        res.status(400);
        throw new Error("Hours must include weekdays, saturday, and sunday");
    }
    // Set default hours if not provided
    const defaultHours = {
        weekdays: "9:00 AM - 7:00 PM",
        saturday: "10:00 AM - 5:00 PM",
        sunday: "Closed",
    };
    // Generate unique branch ID from branchName
    const baseId = generateBranchId(branchName);
    const uniqueId = await ensureUniqueId(baseId);
    // Create new branch
    const branch = await Branch_1.default.create({
        id: uniqueId,
        branchName,
        address,
        phone,
        email,
        hours: hours || defaultHours,
    });
    logger_1.default.info(`New branch added: ${branchName} with ID: ${uniqueId}`);
    res.status(201).json({
        success: true,
        data: branch,
        message: "Branch added successfully",
    });
});
/**
 * @desc    Get all branches
 * @route   GET /api/branch
 * @access  Public
 */
exports.getBranches = (0, express_async_handler_1.default)(async (req, res) => {
    const branches = await Branch_1.default.find();
    res.status(200).json({
        success: true,
        count: branches.length,
        data: branches,
    });
});
/**
 * @desc    Get branch by ID
 * @route   GET /api/branch/:id
 * @access  Public
 */
exports.getBranchById = (0, express_async_handler_1.default)(async (req, res) => {
    const branch = await Branch_1.default.findOne({ id: req.params.id });
    if (!branch) {
        res.status(404);
        throw new Error("Branch not found");
    }
    res.status(200).json({
        success: true,
        data: branch,
    });
});
/**
 * @desc    Update branch
 * @route   PUT /api/branch/:id
 * @access  Private (Super-Admin only)
 */
exports.updateBranch = (0, express_async_handler_1.default)(async (req, res) => {
    // Debug logging
    console.log("=== updateBranch Debug Info ===");
    console.log("Request method:", req.method);
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("=== End Debug Info ===");
    const { id } = req.params;
    // Check if req.body exists and is not empty
    if (!req.body || Object.keys(req.body).length === 0) {
        res.status(400).json({
            success: false,
            error: "Request body is missing or empty. Please send data in JSON format with Content-Type: application/json",
        });
        return;
    }
    const { branchName, address, phone, email, hours } = req.body;
    try {
        // Find branch by custom id or MongoDB _id
        let branch;
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            // Try finding by MongoDB _id first
            branch = await Branch_1.default.findById(id);
            // If not found by _id, try by custom id field
            if (!branch) {
                branch = await Branch_1.default.findOne({ id: id });
            }
        }
        else {
            // Find by custom id field
            branch = await Branch_1.default.findOne({ id: id });
        }
        if (!branch) {
            res.status(404).json({
                success: false,
                error: "Branch not found",
            });
            return;
        }
        // Prepare update data (only include fields that are provided)
        const updateData = {};
        if (branchName !== undefined)
            updateData.branchName = branchName;
        if (address !== undefined)
            updateData.address = address;
        if (phone !== undefined)
            updateData.phone = phone;
        if (email !== undefined)
            updateData.email = email;
        if (hours !== undefined)
            updateData.hours = hours;
        // Update branch using the MongoDB _id
        const updatedBranch = await Branch_1.default.findByIdAndUpdate(branch._id, updateData, { new: true, runValidators: true });
        if (!updatedBranch) {
            res.status(404).json({
                success: false,
                error: "Failed to update branch",
            });
            return;
        }
        logger_1.default.info(`Branch updated: ${updatedBranch.branchName}`);
        res.status(200).json({
            success: true,
            data: updatedBranch,
            message: "Branch updated successfully",
        });
    }
    catch (error) {
        logger_1.default.error(`Error updating branch: ${error.message}`);
        res.status(500).json({
            success: false,
            error: "Failed to update branch",
            details: error.message,
        });
    }
});
/**
 * @desc    Delete branch
 * @route   DELETE /api/branch/:id
 * @access  Private (Super-Admin only)
 */
exports.deleteBranch = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    try {
        let branch;
        // Check if it's a MongoDB ObjectId or custom id
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            // Try finding by MongoDB _id first
            branch = await Branch_1.default.findById(id);
            // If not found by _id, try by custom id field
            if (!branch) {
                branch = await Branch_1.default.findOne({ id: id });
            }
        }
        else {
            // Find by custom id field
            branch = await Branch_1.default.findOne({ id: id });
        }
        if (!branch) {
            res.status(404).json({
                success: false,
                error: "Branch not found",
            });
            return;
        }
        // Delete using MongoDB _id
        await Branch_1.default.findByIdAndDelete(branch._id);
        logger_1.default.info(`Branch deleted: ${branch.branchName}`);
        res.status(200).json({
            success: true,
            message: "Branch deleted successfully",
        });
    }
    catch (error) {
        logger_1.default.error(`Error deleting branch: ${error.message}`);
        res.status(500).json({
            success: false,
            error: "Failed to delete branch",
        });
    }
});
