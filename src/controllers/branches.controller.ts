import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import Branch from "../models/Branch";

import logger from "../utils/logger";

/**
 * @desc    Add a new branch
 * @route   POST /api/branch
 * @access  Private (Super-Admin only)
 */
export const addBranch = asyncHandler(async (req: Request, res: Response) => {
  const { id, name, address, phone, email, hours, staff } = req.body;

  // Validate required fields
  if (!id || !name || !address || !phone || !email) {
    res.status(400);
    throw new Error(
      "Please provide all required fields: id, name, address, phone, and email"
    );
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

  // Check if branch with same ID already exists
  const existingBranch = await Branch.findOne({ id });
  if (existingBranch) {
    res.status(400);
    throw new Error("Branch with this ID already exists");
  }

  // Create new branch
  const branch = await Branch.create({
    id,
    name,
    address,
    phone,
    email,
    hours: hours || defaultHours,
    staff: staff || [],
  });

  logger.info(`New branch added: ${name}`);

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
export const getBranches = asyncHandler(async (req: Request, res: Response) => {
  const branches = await Branch.find();

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
export const getBranchById = asyncHandler(
  async (req: Request, res: Response) => {
    const branch = await Branch.findOne({ id: req.params.id });

    if (!branch) {
      res.status(404);
      throw new Error("Branch not found");
    }

    res.status(200).json({
      success: true,
      data: branch,
    });
  }
);

/**
 * @desc    Update branch
 * @route   PUT /api/branch/:id
 * @access  Private (Super-Admin only)
 */
export const updateBranch = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, address, phone, email, hours } = req.body;

    // Find branch
    let branch = await Branch.findOne({ id: req.params.id });

    if (!branch) {
      res.status(404);
      throw new Error("Branch not found");
    }

    // Update branch
    branch = await Branch.findOneAndUpdate(
      { id: req.params.id },
      { name, address, phone, email, hours },
      { new: true, runValidators: true }
    );

    logger.info(`Branch updated: ${branch?.name}`);

    res.status(200).json({
      success: true,
      data: branch,
      message: "Branch updated successfully",
    });
  }
);

/**
 * @desc    Delete branch
 * @route   DELETE /api/branch/:id
 * @access  Private (Super-Admin only)
 */
export const deleteBranch = asyncHandler(
  async (req: Request, res: Response) => {
    const branch = await Branch.findOne({ id: req.params.id });

    if (!branch) {
      res.status(404);
      throw new Error("Branch not found");
    }

    await Branch.deleteOne({ id: req.params.id });

    logger.info(`Branch deleted: ${branch.name}`);

    res.status(200).json({
      success: true,
      message: "Branch deleted successfully",
    });
  }
);
