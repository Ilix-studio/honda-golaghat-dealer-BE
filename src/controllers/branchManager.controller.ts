import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import BranchManager from "../models/BranchManager";
import { IAdmin } from "../models/Admin";
import mongoose from "mongoose";
import {
  generateRandomPassword,
  generateApplicationId,
} from "../utils/generateID";

import ErrorResponse from "../utils/errorResponse";

// @desc    Generate application ID and password for branch manager
// @route   POST /api/v1/super-admin/branch-managers/generate
// @access  Private (Super Admin only)
export const generateBranchManagerCredentials = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, branchId } = req.body;

    // Check if all required fields are provided
    if (!name || !email || !branchId) {
      return next(
        new ErrorResponse("Please provide name, email and branch ID", 400)
      );
    }

    // Check if the branch exists
    const branchExists = await mongoose.model("Branch").findById(branchId);

    if (!branchExists) {
      return next(
        new ErrorResponse(`Branch with id ${branchId} not found`, 404)
      );
    }

    // Check if a branch manager with this email already exists
    const emailExists = await BranchManager.findOne({ email });

    if (emailExists) {
      return next(
        new ErrorResponse(
          `Branch manager with email ${email} already exists`,
          400
        )
      );
    }

    // Generate application ID and password
    const applicationId = generateApplicationId();
    const password = generateRandomPassword();

    // Create branch manager with generated credentials
    const branchManager = await BranchManager.create({
      name,
      email,
      password,
      applicationId,
      branch: branchId,
      createdBy: (req.user as IAdmin)._id,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: branchManager._id,
        name: branchManager.name,
        email: branchManager.email,
        applicationId: branchManager.applicationId,
        password: password, // Send plain password in response
        branch: branchManager.branch,
      },
    });
  }
);

// @desc    Get all branch managers
// @route   GET /api/v1/super-admin/branch-managers
// @access  Private (Super Admin only)
export const getBranchManagers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
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

// @desc    Get single branch manager
// @route   GET /api/v1/super-admin/branch-managers/:id
// @access  Private (Super Admin only)
export const getBranchManager = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const branchManager = await BranchManager.findById(req.params.id)
      .populate("branch", "name location")
      .populate("createdBy", "name email");

    if (!branchManager) {
      return next(
        new ErrorResponse(
          `Branch manager with id ${req.params.id} not found`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      data: branchManager,
    });
  }
);

// @desc    Update branch manager
// @route   PUT /api/v1/super-admin/branch-managers/:id
// @access  Private (Super Admin only)
export const updateBranchManager = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, isActive, branchId } = req.body;

    let updateData: any = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (branchId) updateData.branch = branchId;

    const branchManager = await BranchManager.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("branch", "name location");

    if (!branchManager) {
      return next(
        new ErrorResponse(
          `Branch manager with id ${req.params.id} not found`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      data: branchManager,
    });
  }
);

// @desc    Delete branch manager
// @route   DELETE /api/v1/super-admin/branch-managers/:id
// @access  Private (Super Admin only)
export const deleteBranchManager = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const branchManager = await BranchManager.findById(req.params.id);

    if (!branchManager) {
      return next(
        new ErrorResponse(
          `Branch manager with id ${req.params.id} not found`,
          404
        )
      );
    }

    await branchManager.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  }
);

// @desc    Regenerate branch manager password
// @route   POST /api/v1/super-admin/branch-managers/:id/regenerate-password
// @access  Private (Super Admin only)
export const regenerateBranchManagerPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const branchManager = await BranchManager.findById(req.params.id).select(
      "+password"
    );

    if (!branchManager) {
      return next(
        new ErrorResponse(
          `Branch manager with id ${req.params.id} not found`,
          404
        )
      );
    }

    // Generate new password
    const newPassword = generateRandomPassword();

    // Update password
    branchManager.password = newPassword;
    await branchManager.save();

    res.status(200).json({
      success: true,
      data: {
        _id: branchManager._id,
        name: branchManager.name,
        email: branchManager.email,
        newPassword: newPassword,
      },
    });
  }
);
