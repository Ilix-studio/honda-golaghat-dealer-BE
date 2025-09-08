import asyncHandler from "express-async-handler";
import { Request, Response } from "express";

import mongoose from "mongoose";
import ServiceAddonsModel from "../../models/CustomerSystem/ServiceAddons";
import logger from "../../utils/logger";

/**
 * @desc    Create service package
 * @route   POST /api/service-packages
 * @access  Private (Admin)
 */
export const createServicePackage = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      modelName,
      firstService,
      secondService,
      thirdService,
      paidServiceOne,
      paidServiceTwo,
      paidServiceThree,
      paidServiceFour,
      paidServiceFive,
      additionalServices,
      validFrom,
      validUntil,
      applicableBranches,
    } = req.body;

    // Check if service package already exists for this motorcycle
    const existingPackage = await ServiceAddonsModel.findOne({
      modelName,
      isActive: true,
    });

    if (existingPackage) {
      res.status(400);
      throw new Error(
        "Service package already exists for this motorcycle model"
      );
    }

    const servicePackage = await ServiceAddonsModel.create({
      modelName,
      firstService,
      secondService,
      thirdService,
      paidServiceOne,
      paidServiceTwo,
      paidServiceThree,
      paidServiceFour,
      paidServiceFive,
      additionalServices: additionalServices || [],
      validFrom: validFrom || new Date(),
      validUntil,
      applicableBranches: applicableBranches || [],
    });

    await servicePackage.populate("modelName", "modelName category");

    logger.info(
      `Service package created for motorcycle: ${servicePackage.modelName}`
    );

    res.status(201).json({
      success: true,
      message: "Service package created successfully",
      data: servicePackage,
    });
  }
);

/**
 * @desc    Get all service packages
 * @route   GET /api/service-packages
 * @access  Private (Admin)
 */
export const getAllServicePackages = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }
    if (req.query.modelName) {
      filter.modelName = req.query.modelName;
    }

    const total = await ServiceAddonsModel.countDocuments(filter);
    const servicePackages = await ServiceAddonsModel.find(filter)
      .populate("modelName", "modelName category")
      .populate("applicableBranches", "name address")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: servicePackages.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: servicePackages,
    });
  }
);

/**
 * @desc    Get service package by ID
 * @route   GET /api/service-packages/:id
 * @access  Private (Admin)
 */
export const getServicePackageById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid service package ID");
    }

    const servicePackage = await ServiceAddonsModel.findById(id)
      .populate("modelName", "modelName category")
      .populate("applicableBranches", "name address");

    if (!servicePackage) {
      res.status(404);
      throw new Error("Service package not found");
    }

    res.status(200).json({
      success: true,
      data: servicePackage,
    });
  }
);

/**
 * @desc    Update service package
 * @route   PUT /api/service-packages/:id
 * @access  Private (Admin)
 */
export const updateServicePackage = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid service package ID");
    }

    const servicePackage = await ServiceAddonsModel.findById(id);
    if (!servicePackage) {
      res.status(404);
      throw new Error("Service package not found");
    }

    const updatedPackage = await ServiceAddonsModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("modelName", "modelName category")
      .populate("applicableBranches", "name address");

    logger.info(`Service package updated: ${updatedPackage?.modelName}`);

    res.status(200).json({
      success: true,
      message: "Service package updated successfully",
      data: updatedPackage,
    });
  }
);

/**
 * @desc    Delete service package
 * @route   DELETE /api/service-packages/:id
 * @access  Private (Super-Admin)
 */
export const deleteServicePackage = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const servicePackage = await ServiceAddonsModel.findById(id);
    if (!servicePackage) {
      res.status(404);
      throw new Error("Service package not found");
    }

    // Soft delete
    await ServiceAddonsModel.findByIdAndUpdate(id, { isActive: false });

    logger.warn(`Service package deleted: ${servicePackage.modelName}`);

    res.status(200).json({
      success: true,
      message: "Service package deleted successfully",
    });
  }
);

/**
 * @desc    Get service packages by motorcycle
 * @route   GET /api/service-packages/motorcycle/:motorcycleId
 * @access  Private (Admin)
 */
export const getServicePackagesByMotorcycle = asyncHandler(
  async (req: Request, res: Response) => {
    const { motorcycleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(motorcycleId)) {
      res.status(400);
      throw new Error("Invalid motorcycle ID");
    }

    const servicePackages = await ServiceAddonsModel.find({
      modelName: motorcycleId,
      isActive: true,
    })
      .populate("modelName", "modelName category")
      .populate("applicableBranches", "name address")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: servicePackages.length,
      data: servicePackages,
    });
  }
);

/**
 * @desc    Get active service packages
 * @route   GET /api/service-packages/active
 * @access  Private (Admin or Customer)
 */
export const getActiveServicePackages = asyncHandler(
  async (req: Request, res: Response) => {
    const currentDate = new Date();

    const servicePackages = await ServiceAddonsModel.find({
      isActive: true,
      validFrom: { $lte: currentDate },
      validUntil: { $gte: currentDate },
    })
      .populate("modelName", "modelName category")
      .populate("applicableBranches", "name address")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: servicePackages.length,
      data: servicePackages,
    });
  }
);

/**
 * @desc    Get customer service packages
 * @route   GET /api/service-packages/customer/:modelName
 * @access  Private (Customer)
 */
export const getCustomerServicePackages = asyncHandler(
  async (req: Request, res: Response) => {
    const { modelName } = req.params;
    const customerId = req.customer?._id;

    if (!mongoose.Types.ObjectId.isValid(modelName)) {
      res.status(400);
      throw new Error("Invalid motorcycle model ID");
    }

    // Find customer's vehicle to determine service eligibility
    const CustomerDashModel = require("../models/CustomerDashModel");
    const customerVehicle = await CustomerDashModel.findOne({
      customer: customerId,
      isActive: true,
    }).populate("customer");

    if (!customerVehicle) {
      res.status(404);
      throw new Error("No vehicle found for customer");
    }

    const currentDate = new Date();
    const servicePackage = await ServiceAddonsModel.findOne({
      modelName,
      isActive: true,
      validFrom: { $lte: currentDate },
      validUntil: { $gte: currentDate },
    })
      .populate("modelName", "modelName category")
      .populate("applicableBranches", "name address");

    if (!servicePackage) {
      res.status(404);
      throw new Error("No service package found for this motorcycle");
    }

    // Determine available services based on vehicle service history
    const serviceHistory = customerVehicle.serviceStatus.serviceHistory;
    const availableServices = [];

    // Free services (first 3)
    if (serviceHistory === 0) {
      availableServices.push({
        type: "firstService",
        service: servicePackage.firstService,
        eligible: true,
        description: "First Free Service",
      });
    } else if (serviceHistory === 1) {
      availableServices.push({
        type: "secondService",
        service: servicePackage.secondService,
        eligible: true,
        description: "Second Free Service",
      });
    } else if (serviceHistory === 2) {
      availableServices.push({
        type: "thirdService",
        service: servicePackage.thirdService,
        eligible: true,
        description: "Third Free Service",
      });
    }

    // Paid services
    if (serviceHistory >= 3) {
      availableServices.push(
        {
          type: "paidServiceOne",
          service: servicePackage.paidServiceOne,
          eligible: true,
          description: "Regular Paid Service",
        },
        {
          type: "paidServiceTwo",
          service: servicePackage.paidServiceTwo,
          eligible: true,
          description: "Comprehensive Service",
        }
      );

      if (servicePackage.paidServiceThree) {
        availableServices.push({
          type: "paidServiceThree",
          service: servicePackage.paidServiceThree,
          eligible: true,
          description: "Premium Service",
        });
      }
    }

    // Additional services (always available)
    servicePackage.additionalServices.forEach((service, index) => {
      availableServices.push({
        type: `additionalService${index + 1}`,
        service,
        eligible: true,
        description: "Additional Service",
      });
    });

    res.status(200).json({
      success: true,
      data: {
        vehicle: {
          _id: customerVehicle._id,
          modelNameName: customerVehicle.modelNameName,
          numberPlate: customerVehicle.numberPlate,
          serviceHistory: customerVehicle.serviceStatus.serviceHistory,
          currentKilometers: customerVehicle.serviceStatus.kilometers,
        },
        servicePackage: {
          _id: servicePackage._id,
          modelName: servicePackage.modelName,
          validFrom: servicePackage.validFrom,
          validUntil: servicePackage.validUntil,
        },
        availableServices,
      },
    });
  }
);
