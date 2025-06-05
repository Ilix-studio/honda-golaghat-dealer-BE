import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import Branch from "../models/Branch";
import mongoose from "mongoose";
import logger from "../utils/logger";

/**
 * @desc    Create staff member
 * @route   POST /api/admin/create-staffM
 * @access  Private (Super-Admin and Branch-Managers)
 */
export const createStaffM = asyncHandler(
  async (req: Request, res: Response) => {
    const { branchId, name, position } = req.body;

    // Validate input
    if (!branchId || !name || !position) {
      res.status(400);
      throw new Error("Please provide branch ID, staff name, and position");
    }

    // Validate branch ID
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      res.status(400);
      throw new Error("Invalid branch ID");
    }

    // Check if branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      res.status(404);
      throw new Error("Branch not found");
    }

    // For Branch Managers, verify they can only add staff to their own branch
    if (
      req.user.role === "Branch-Admin" &&
      req.user.branch.toString() !== branchId
    ) {
      res.status(403);
      throw new Error("You can only add staff to your assigned branch");
    }

    // Add staff member to branch
    branch.staff.push({ name, position });
    await branch.save();

    logger.info(
      `Staff member ${name} added to branch ${branch.name} by ${req.user.role}`
    );

    res.status(201).json({
      success: true,
      message: "Staff member added successfully",
      data: {
        name,
        position,
        branch: branch.name,
      },
    });
  }
);

/**
 * @desc    Get all staff members for a branch
 * @route   GET /api/admin/staff/:branchId
 * @access  Private (Super-Admin or Branch-Admin)
 */
export const getStaffByBranch = asyncHandler(
  async (req: Request, res: Response) => {
    const { branchId } = req.params;

    // Validate branch ID
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      res.status(400);
      throw new Error("Invalid branch ID");
    }

    // Find branch
    const branch = await Branch.findById(branchId);
    if (!branch) {
      res.status(404);
      throw new Error("Branch not found");
    }

    // For Branch Managers, verify they can only view staff from their own branch
    if (
      req.user.role === "Branch-Admin" &&
      req.user.branch.toString() !== branchId
    ) {
      res.status(403);
      throw new Error("You can only view staff from your assigned branch");
    }

    res.status(200).json({
      success: true,
      count: branch.staff.length,
      data: branch.staff,
    });
  }
);

/**
 * @desc    Update staff member details
 * @route   PUT /api/admin/staff/:branchId/:staffIndex
 * @access  Private (Super-Admin or Branch-Admin)
 */
export const updateStaffMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { branchId, staffIndex } = req.params;
    const { name, position } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
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
    const branch = await Branch.findById(branchId);
    if (!branch) {
      res.status(404);
      throw new Error("Branch not found");
    }

    // For Branch Managers, verify they can only manage staff in their own branch
    if (
      req.user.role === "Branch-Admin" &&
      req.user.branch.toString() !== branchId
    ) {
      res.status(403);
      throw new Error("You can only manage staff in your assigned branch");
    }

    // Check if staff index is valid
    if (index < 0 || index >= branch.staff.length) {
      res.status(404);
      throw new Error("Staff member not found");
    }

    // Update staff member
    if (name) branch.staff[index].name = name;
    if (position) branch.staff[index].position = position;

    await branch.save();

    logger.info(
      `Staff member updated in branch ${branch.name} by ${req.user.role}`
    );

    res.status(200).json({
      success: true,
      message: "Staff member updated successfully",
      data: branch.staff[index],
    });
  }
);

/**
 * @desc    Remove staff member from a branch
 * @route   DELETE /api/admin/staff/:branchId/:staffIndex
 * @access  Private (Super-Admin or Branch-Admin)
 */
export const removeStaffMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { branchId, staffIndex } = req.params;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      res.status(400);
      throw new Error("Invalid branch ID");
    }

    const index = parseInt(staffIndex);
    if (isNaN(index)) {
      res.status(400);
      throw new Error("Invalid staff index");
    }

    // Find branch
    const branch = await Branch.findById(branchId);
    if (!branch) {
      res.status(404);
      throw new Error("Branch not found");
    }

    // For Branch Managers, verify they can only manage staff in their own branch
    if (
      req.user.role === "Branch-Admin" &&
      req.user.branch.toString() !== branchId
    ) {
      res.status(403);
      throw new Error("You can only manage staff in your assigned branch");
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

    logger.info(
      `Staff member ${removedStaff.name} removed from branch ${branch.name} by ${req.user.role}`
    );

    res.status(200).json({
      success: true,
      message: "Staff member removed successfully",
    });
  }
);
