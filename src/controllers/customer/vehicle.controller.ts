import asyncHandler from "express-async-handler";
import { Request, Response } from "express";

import CustomerModel from "../../models/CustomerSystem/CustomerModel";
import mongoose from "mongoose";
import logger from "../../utils/logger";
import CustomerVehicleModel from "../../models/CustomerSystem/VehicleModel";

/**
 * @desc    Get all customer vehicles (Admin)
 * @route   GET /api/customer-vehicles
 * @access  Private (Admin)
 */
export const getAllCustomerVehicles = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.year) filter.year = req.query.year;
    if (req.query.fuelNorms) filter.fuelNorms = req.query.fuelNorms;
    if (req.query.serviceType) {
      filter["serviceStatus.serviceType"] = req.query.serviceType;
    }

    const vehicles = await CustomerVehicleModel.find(filter)
      .populate("customer", "firstName lastName phoneNumber email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CustomerVehicleModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: vehicles.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: vehicles,
    });
  }
);

/**
 * @desc    Get customer's own vehicles
 * @route   GET /api/customer-vehicles/my-vehicles
 * @access  Private (Customer)
 */
export const getMyVehicles = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = req.customer?._id;

    const vehicles = await CustomerVehicleModel.find({
      customer: customerId,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  }
);

/**
 * @desc    Get vehicle by ID
 * @route   GET /api/customer-vehicles/:id
 * @access  Private (Customer/Admin)
 */
export const getVehicleById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid vehicle ID");
    }

    const vehicle = await CustomerVehicleModel.findById(id).populate(
      "customer",
      "firstName lastName phoneNumber email"
    );

    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found");
    }

    // Check if customer is accessing their own vehicle
    if (
      req.customer &&
      vehicle.customer._id.toString() !== req.customer._id.toString()
    ) {
      res.status(403);
      throw new Error("Access denied");
    }

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  }
);

/**
 * @desc    Create new vehicle
 * @route   POST /api/customer-vehicles
 * @access  Private (Admin)
 */
export const createVehicle = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      category,
      modelName,
      year,
      registrationDate,
      engineNumber,
      chassisNumber,
      fitnessUpto,
      insurance,
      fuelNorms,
      isPaid,
      isFinance,
      engineCapacity,
      uniqueBookRecord,
      color,
      purchaseDate,
      customer,
      numberPlate,
      registeredOwnerName,
      motorcyclePhoto,
      rtoInfo,
    } = req.body;

    // Validate customer exists
    const customerExists = await CustomerModel.findById(customer);
    if (!customerExists) {
      res.status(404);
      throw new Error("Customer not found");
    }

    // Check for duplicates
    const existingVehicle = await CustomerVehicleModel.findOne({
      $or: [
        { engineNumber: engineNumber.toUpperCase() },
        { chassisNumber: chassisNumber.toUpperCase() },
        ...(numberPlate ? [{ numberPlate: numberPlate.toUpperCase() }] : []),
      ],
    });

    if (existingVehicle) {
      res.status(400);
      throw new Error(
        "Vehicle with this engine number, chassis number, or number plate already exists"
      );
    }

    const vehicle = await CustomerVehicleModel.create({
      category,
      modelName,
      year,
      registrationDate,
      engineNumber: engineNumber.toUpperCase(),
      chassisNumber: chassisNumber.toUpperCase(),
      fitnessUpto,
      insurance,
      fuelNorms,
      isPaid,
      isFinance,
      engineCapacity,
      uniqueBookRecord,
      color,
      purchaseDate,
      customer,
      numberPlate: numberPlate?.toUpperCase(),
      registeredOwnerName:
        registeredOwnerName ||
        `${customerExists.firstName} ${customerExists.lastName}`,
      motorcyclePhoto,
      rtoInfo: rtoInfo
        ? {
            rtoCode: rtoInfo.rtoCode.toUpperCase(),
            rtoName: rtoInfo.rtoName,
            rtoAddress: rtoInfo.rtoAddress,
            state: rtoInfo.state.toUpperCase(),
          }
        : undefined,
      serviceStatus: {
        serviceType: "Regular",
        kilometers: 0,
        serviceHistory: 0,
      },
    });

    await vehicle.populate("customer", "firstName lastName phoneNumber");

    logger.info(
      `Vehicle created: ${vehicle.engineNumber} for customer ${customerExists.phoneNumber}`
    );

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: vehicle,
    });
  }
);

/**
 * @desc    Update vehicle
 * @route   PUT /api/customer-vehicles/:id
 * @access  Private (Admin)
 */
export const updateVehicle = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid vehicle ID");
    }

    const vehicle = await CustomerVehicleModel.findById(id);
    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found");
    }

    // Check for duplicates if updating unique fields
    const {
      engineNumber,
      chassisNumber,
      numberPlate,
      rtoInfo,
      ...otherUpdates
    } = req.body;

    if (engineNumber || chassisNumber || numberPlate) {
      const duplicateFilter: any = { _id: { $ne: id }, $or: [] };

      if (engineNumber && engineNumber !== vehicle.engineNumber) {
        duplicateFilter.$or.push({ engineNumber: engineNumber.toUpperCase() });
      }
      if (chassisNumber && chassisNumber !== vehicle.chassisNumber) {
        duplicateFilter.$or.push({
          chassisNumber: chassisNumber.toUpperCase(),
        });
      }
      if (numberPlate && numberPlate !== vehicle.numberPlate) {
        duplicateFilter.$or.push({ numberPlate: numberPlate.toUpperCase() });
      }

      if (duplicateFilter.$or.length > 0) {
        const duplicate = await CustomerVehicleModel.findOne(duplicateFilter);
        if (duplicate) {
          res.status(400);
          throw new Error("Another vehicle with these details already exists");
        }
      }
    }

    // Prepare update data
    const updateData: any = { ...otherUpdates };
    if (engineNumber) updateData.engineNumber = engineNumber.toUpperCase();
    if (chassisNumber) updateData.chassisNumber = chassisNumber.toUpperCase();
    if (numberPlate) updateData.numberPlate = numberPlate.toUpperCase();
    if (rtoInfo) {
      updateData.rtoInfo = {
        rtoCode: rtoInfo.rtoCode.toUpperCase(),
        rtoName: rtoInfo.rtoName,
        rtoAddress: rtoInfo.rtoAddress,
        state: rtoInfo.state.toUpperCase(),
      };
    }

    const updatedVehicle = await CustomerVehicleModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("customer", "firstName lastName phoneNumber");

    logger.info(`Vehicle updated: ${updatedVehicle?.engineNumber} by admin`);

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: updatedVehicle,
    });
  }
);

/**
 * @desc    Delete vehicle
 * @route   DELETE /api/customer-vehicles/:id
 * @access  Private (Admin)
 */
export const deleteVehicle = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid vehicle ID");
    }

    // Soft delete
    const vehicle = await CustomerVehicleModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found");
    }

    logger.info(`Vehicle soft deleted: ${vehicle.engineNumber}`);

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  }
);

/**
 * @desc    Update vehicle service status
 * @route   PUT /api/customer-vehicles/:id/service-status
 * @access  Private (Admin)
 */
export const updateServiceStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { lastServiceDate, nextServiceDue, serviceType, kilometers } =
      req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid vehicle ID");
    }

    const vehicle = await CustomerVehicleModel.findById(id);
    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found");
    }

    // Update service status
    const serviceUpdate: any = {};
    if (lastServiceDate)
      serviceUpdate["serviceStatus.lastServiceDate"] = lastServiceDate;
    if (nextServiceDue)
      serviceUpdate["serviceStatus.nextServiceDue"] = nextServiceDue;
    if (serviceType) serviceUpdate["serviceStatus.serviceType"] = serviceType;
    if (kilometers !== undefined) {
      serviceUpdate["serviceStatus.kilometers"] = kilometers;
    }

    // Increment service history if last service date is updated
    if (lastServiceDate) {
      serviceUpdate["$inc"] = { "serviceStatus.serviceHistory": 1 };
    }

    const updatedVehicle = await CustomerVehicleModel.findByIdAndUpdate(
      id,
      serviceUpdate,
      { new: true }
    ).populate("customer", "firstName lastName phoneNumber");

    res.status(200).json({
      success: true,
      message: "Service status updated successfully",
      data: updatedVehicle,
    });
  }
);

/**
 * @desc    Get vehicles requiring service
 * @route   GET /api/customer-vehicles/service-due
 * @access  Private (Admin)
 */
export const getServiceDueVehicles = asyncHandler(
  async (req: Request, res: Response) => {
    const currentDate = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(currentDate.getDate() + 7);

    const vehicles = await CustomerVehicleModel.find({
      isActive: true,
      $or: [
        { "serviceStatus.nextServiceDue": { $lte: currentDate } },
        { "serviceStatus.serviceType": "Overdue" },
        {
          "serviceStatus.nextServiceDue": {
            $gte: currentDate,
            $lte: nextWeek,
          },
        },
      ],
    })
      .populate("customer", "firstName lastName phoneNumber")
      .sort({ "serviceStatus.nextServiceDue": 1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  }
);

/**
 * @desc    Get vehicle statistics
 * @route   GET /api/customer-vehicles/stats
 * @access  Private (Admin)
 */
export const getVehicleStats = asyncHandler(
  async (req: Request, res: Response) => {
    const totalVehicles = await CustomerVehicleModel.countDocuments({
      isActive: true,
    });

    const categoryStats = await CustomerVehicleModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const fuelNormsStats = await CustomerVehicleModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$fuelNorms", count: { $sum: 1 } } },
    ]);

    const serviceStats = await CustomerVehicleModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$serviceStatus.serviceType", count: { $sum: 1 } } },
    ]);

    const currentYear = new Date().getFullYear();
    const fitnessExpired = await CustomerVehicleModel.countDocuments({
      isActive: true,
      fitnessUpto: { $lt: currentYear },
    });

    const insuranceStats = await CustomerVehicleModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$insurance", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalVehicles,
        categoryStats: categoryStats.reduce(
          (acc, curr) => ({ ...acc, [curr._id]: curr.count }),
          {}
        ),
        fuelNormsStats: fuelNormsStats.reduce(
          (acc, curr) => ({ ...acc, [curr._id]: curr.count }),
          {}
        ),
        serviceStats: serviceStats.reduce(
          (acc, curr) => ({ ...acc, [curr._id]: curr.count }),
          {}
        ),
        fitnessExpiredCount: fitnessExpired,
        insuranceStats: insuranceStats.reduce(
          (acc, curr) => ({
            ...acc,
            [curr._id ? "insured" : "notInsured"]: curr.count,
          }),
          {}
        ),
      },
    });
  }
);

/**
 * @desc    Transfer vehicle ownership
 * @route   PUT /api/customer-vehicles/:id/transfer
 * @access  Private (Admin)
 */
export const transferVehicle = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { newCustomerId, newOwnerName } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(newCustomerId)
    ) {
      res.status(400);
      throw new Error("Invalid vehicle or customer ID");
    }

    const newCustomer = await CustomerModel.findById(newCustomerId);
    if (!newCustomer) {
      res.status(404);
      throw new Error("New customer not found");
    }

    const vehicle = await CustomerVehicleModel.findByIdAndUpdate(
      id,
      {
        customer: newCustomerId,
        registeredOwnerName:
          newOwnerName || `${newCustomer.firstName} ${newCustomer.lastName}`,
      },
      { new: true }
    ).populate("customer", "firstName lastName phoneNumber");

    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found");
    }

    logger.info(
      `Vehicle ${vehicle.engineNumber} transferred to ${newCustomer.phoneNumber}`
    );

    res.status(200).json({
      success: true,
      message: "Vehicle ownership transferred successfully",
      data: vehicle,
    });
  }
);
