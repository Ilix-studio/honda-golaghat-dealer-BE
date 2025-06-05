// auth.controller.ts
import asyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
import Admin from "../models/Admin";
import logger from "../utils/logger";

import dotenv from "dotenv";
import BranchManager from "../models/BranchManager";
import Branch from "../models/Branch";
import mongoose from "mongoose";
import {
  generateApplicationId,
  generateRandomPassword,
} from "../utils/generateID";

dotenv.config();

// Make two admin Super-Admin and Branch-Manager
/**
 * @desc    Login Super-Admin  and generate token
 * @route   POST /api/admin/login
 * @access  Public
 */
export const loginSuperAdmin = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
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
    const admin = await Admin.findOne({ email }).select("+password");

    // Check if admin exists and password matches
    if (!admin || !(await admin.matchPassword(password))) {
      logger.info(`Failed login attempt for email: ${email}`);
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Generate token
    const token = admin.getSignedJwtToken();

    // Log successful login
    logger.info(`Admin logged in: ${admin.email}`);

    // Return success with token
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        token,
      },
    });
  }
);

/**
 * @desc    Logout Super-Admin
 * @route   POST /api/admin/logout
 * @access  Private
 */
export const logoutSuperAdmin = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get admin info from auth middleware

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  }
);
export const createBranchM = asyncHandler(
  async (req: Request, res: Response) => {
    const { branch } = req.body;

    // Validate required fields
    if (!branch) {
      res.status(400);
      throw new Error("Please provide branch ID");
    }

    // Validate branch exists
    if (!mongoose.Types.ObjectId.isValid(branch)) {
      res.status(400);
      throw new Error("Invalid branch ID");
    }

    const branchExists = await Branch.findById(branch);
    if (!branchExists) {
      res.status(404);
      throw new Error(
        "Branch not found. Please create a branch first before creating a branch manager."
      );
    }

    // Generate application ID and password
    const applicationId = generateApplicationId();
    const password = generateRandomPassword();

    // Create branch manager
    const branchManager = await BranchManager.create({
      applicationId,
      password,
      branch,
      createdBy: req.user._id,
    });

    // Log creation
    logger.info(`Branch manager created for branch: ${branchExists.name}`);

    // Return success response with credentials
    res.status(201).json({
      success: true,
      message: "Branch manager created successfully",
      data: {
        applicationId: branchManager.applicationId,
        password: password, // Only returned once at creation
        branch: branchExists.name,
      },
    });
  }
);
export const loginBranchM = asyncHandler(
  async (req: Request, res: Response) => {
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
    const branchManager = await BranchManager.findOne({ applicationId }).select(
      "+password"
    );

    // Check if branch manager exists and password matches
    if (!branchManager || !(await branchManager.matchPassword(password))) {
      logger.info(`Failed login attempt for application ID: ${applicationId}`);
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Populate branch details
    await branchManager.populate("branch", "name location");

    // Generate token
    const token = branchManager.getSignedJwtToken();

    // Log successful login
    logger.info(`Branch manager logged in: ${branchManager.applicationId}`);

    // Return success with token
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: branchManager._id,
        applicationId: branchManager.applicationId,
        branch: branchManager.branch,
        token,
      },
    });
  }
);
export const logoutBranchM = asyncHandler(
  async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  }
);

export const deleteBranchM = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid branch manager ID");
    }

    const branchManager = await BranchManager.findById(id);

    if (!branchManager) {
      res.status(404);
      throw new Error("Branch manager not found");
    }

    // Get branch details for logging
    const branch = await Branch.findById(branchManager.branch);

    // Delete the branch manager
    await BranchManager.findByIdAndDelete(id);

    logger.info(
      `Branch manager deleted from branch: ${branch?.name || "Unknown"}`
    );

    res.status(200).json({
      success: true,
      message: "Branch manager deleted successfully",
    });
  }
);

/**
 * @desc    Get all branch managers
 * @route   GET /api/admin/branch-managers
 * @access  Private (Super-Admin only)
 */
export const getAllBranchManagers = asyncHandler(
  async (req: Request, res: Response) => {
    const branchManagers = await BranchManager.find()
      .populate("branch", "name location")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      count: branchManagers.length,
      data: branchManagers,
    });
  }
);

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
