import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import ServiceAddonsModel from "../../models/BikeSystemModel2/ServiceAddons";

import mongoose from "mongoose";
import logger from "../../utils/logger";

/**
 * @desc    Create service addon
 * @route   POST /api/service-addons/create
 * @access  Private (Admin)
 */
export const createServiceAddon = asyncHandler(
  async (req: Request, res: Response) => {
    const { serviceName, validFrom, validUntil, branch } = req.body;

    // Validate required fields
    if (!serviceName || !validUntil || !branch) {
      res.status(400);
      throw new Error("Please provide all required fields");
    }

    // Validate branch exists
    if (!mongoose.Types.ObjectId.isValid(branch)) {
      res.status(400);
      throw new Error("Invalid branch ID");
    }

    // Create service addon
    const serviceAddon = await ServiceAddonsModel.create({
      serviceName,
      validFrom: validFrom || new Date(),
      validUntil,
      branch,
    });

    await serviceAddon.populate("branch", "branchName address");

    logger.info(`Service addon created: ${serviceName.name}`);

    res.status(201).json({
      success: true,
      message: "Service addon created successfully",
      data: serviceAddon,
    });
  }
);

/**
 * @desc    Get all service addons
 * @route   GET /api/service-addons
 * @access  Private (Admin)
 */
export const getServiceAddons = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (req.query.branch) filter.branch = req.query.branch;
    if (req.query.isActive !== undefined)
      filter.isActive = req.query.isActive === "true";

    const total = await ServiceAddonsModel.countDocuments(filter);
    const serviceAddons = await ServiceAddonsModel.find(filter)
      .populate("branch", "branchName address")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: serviceAddons.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: serviceAddons,
    });
  }
);

/**
 * @desc    Get service addon by ID
 * @route   GET /api/service-addons/:id
 * @access  Private (Admin)
 */
export const getServiceAddonById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid service addon ID");
    }

    const serviceAddon = await ServiceAddonsModel.findById(id).populate(
      "branch",
      "branchName address phone"
    );

    if (!serviceAddon) {
      res.status(404);
      throw new Error("Service addon not found");
    }

    res.status(200).json({
      success: true,
      data: serviceAddon,
    });
  }
);
