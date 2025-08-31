// src/controllers/customerDashboard.controller.ts
import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import CustomerDashModel from "../../models/CustomerSystem/CustomerDashModel";
import mongoose from "mongoose";
import CustomerModel from "../../models/CustomerSystem/CustomerModel";
import logger from "../../utils/logger";
import CustomerActiveServiceModel from "../../models/CustomerSystem/CustomerActiveServices";
import ValueAddedServiceModel from "../../models/CustomerSystem/VASmodel";

/**
 * @desc    Create vehicle (Admin only)
 * @route   POST /api/customer-dashboard/vehicles
 * @access  Private (Admin)
 */
export const createCustomerVehicle = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      motorcyclemodelName,
      engineNumber,
      chassisNumber,
      numberPlate,
      registeredOwnerName,
      customer,
      motorcyclePhoto,
      rtoInfo,
      fitnessUpTo,
      registrationDate,
      serviceStatus,
    } = req.body;

    // Validate customer exists
    const customerExists = await CustomerModel.findById(customer);
    if (!customerExists) {
      res.status(404);
      throw new Error("Customer not found");
    }

    // Check for duplicates
    const existingVehicle = await CustomerDashModel.findOne({
      $or: [
        { engineNumber: engineNumber.toUpperCase() },
        { chassisNumber: chassisNumber.toUpperCase() },
        { numberPlate: numberPlate.toUpperCase() },
      ],
    });

    if (existingVehicle) {
      res.status(400);
      throw new Error(
        "Vehicle with this engine number, chassis number, or number plate already exists"
      );
    }

    const vehicle = await CustomerDashModel.create({
      motorcyclemodelName,
      engineNumber: engineNumber.toUpperCase(),
      chassisNumber: chassisNumber.toUpperCase(),
      numberPlate: numberPlate.toUpperCase(),
      registeredOwnerName,
      customer,
      motorcyclePhoto,
      rtoInfo: {
        rtoCode: rtoInfo.rtoCode.toUpperCase(),
        rtoName: rtoInfo.rtoName,
        rtoAddress: rtoInfo.rtoAddress,
        state: rtoInfo.state.toUpperCase(),
      },
      fitnessUpTo,
      registrationDate,
      serviceStatus: serviceStatus || {
        serviceType: "Regular",
        kilometers: 0,
        serviceHistory: 0,
      },
    });

    await vehicle.populate("customer", "firstName lastName phoneNumber");

    logger.info(
      `Vehicle created by admin: ${vehicle.numberPlate} for customer ${customer}`
    );

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: vehicle,
    });
  }
);

/**
 * @desc    Update vehicle (Admin only)
 * @route   PUT /api/customer-dashboard/vehicles/:id
 * @access  Private (Admin)
 */
export const updateCustomerVehicle = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid vehicle ID");
    }

    const vehicle = await CustomerDashModel.findById(id);
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
        const duplicate = await CustomerDashModel.findOne(duplicateFilter);
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

    const updatedVehicle = await CustomerDashModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("customer", "firstName lastName phoneNumber");

    logger.info(`Vehicle updated by admin: ${updatedVehicle?.numberPlate}`);

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: updatedVehicle,
    });
  }
);

/**
 * @desc    Delete vehicle (Super-Admin only)
 * @route   DELETE /api/customer-dashboard/vehicles/:id
 * @access  Private (Super-Admin)
 */
export const deleteCustomerVehicle = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const vehicle = await CustomerDashModel.findById(id);
    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found");
    }

    // Soft delete
    await CustomerDashModel.findByIdAndUpdate(id, { isActive: false });

    logger.warn(`Vehicle deleted by admin: ${vehicle.numberPlate}`);

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  }
);

/**
 * @desc    Get all customer vehicles (Admin)
 * @route   GET /api/customer-dashboard/admin/vehicles
 * @access  Private (Admin)
 */
export const getAllCustomerVehicles = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { isActive: true };
    if (req.query.serviceType) {
      filter["serviceStatus.serviceType"] = req.query.serviceType;
    }
    if (req.query.rtoCode) {
      filter["rtoInfo.rtoCode"] = req.query.rtoCode.toString().toUpperCase();
    }
    if (req.query.customerId) {
      filter.customer = req.query.customerId;
    }

    const total = await CustomerDashModel.countDocuments(filter);
    const vehicles = await CustomerDashModel.find(filter)
      .populate("customer", "firstName lastName phoneNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: vehicles.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: vehicles,
    });
  }
);

/**
 * @desc    Update vehicle service status (Admin)
 * @route   PUT /api/customer-dashboard/vehicles/:id/service-status
 * @access  Private (Admin)
 */
export const updateVehicleServiceStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { serviceType, kilometers, lastServiceDate, nextServiceDue } =
      req.body;

    const vehicle = await CustomerDashModel.findById(id);
    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found");
    }

    const updateData: any = {};
    if (serviceType) updateData["serviceStatus.serviceType"] = serviceType;
    if (kilometers !== undefined)
      updateData["serviceStatus.kilometers"] = kilometers;
    if (lastServiceDate)
      updateData["serviceStatus.lastServiceDate"] = lastServiceDate;
    if (nextServiceDue)
      updateData["serviceStatus.nextServiceDue"] = nextServiceDue;

    // Increment service history if service completed
    if (serviceType === "Up to Date" && lastServiceDate) {
      updateData["$inc"] = { "serviceStatus.serviceHistory": 1 };
    }

    const updatedVehicle = await CustomerDashModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("customer", "firstName lastName phoneNumber");

    logger.info(
      `Service status updated for ${updatedVehicle?.numberPlate}: ${serviceType}`
    );

    res.status(200).json({
      success: true,
      message: "Service status updated successfully",
      data: updatedVehicle,
    });
  }
);

/**
 * @desc    Get vehicles due for service (Admin)
 * @route   GET /api/customer-dashboard/admin/service-due
 * @access  Private (Admin)
 */
export const getServiceDueVehicles = asyncHandler(
  async (req: Request, res: Response) => {
    const { days = 30 } = req.query;
    const daysAhead = parseInt(days as string);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const serviceDueVehicles = await CustomerDashModel.find({
      isActive: true,
      $or: [
        { "serviceStatus.serviceType": "Overdue" },
        {
          "serviceStatus.serviceType": "Due Soon",
          "serviceStatus.nextServiceDue": { $lte: futureDate },
        },
      ],
    })
      .populate("customer", "firstName lastName phoneNumber")
      .sort({ "serviceStatus.nextServiceDue": 1 });

    res.status(200).json({
      success: true,
      count: serviceDueVehicles.length,
      data: serviceDueVehicles,
    });
  }
);

/**
 * @desc    Get vehicle statistics (Admin)
 * @route   GET /api/customer-dashboard/admin/stats
 * @access  Private (Admin)
 */
export const getVehicleStats = asyncHandler(
  async (req: Request, res: Response) => {
    const totalVehicles = await CustomerDashModel.countDocuments({
      isActive: true,
    });

    const serviceStats = await CustomerDashModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$serviceStatus.serviceType", count: { $sum: 1 } } },
    ]);

    const stateStats = await CustomerDashModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$rtoInfo.state", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const fitnessExpired = await CustomerDashModel.countDocuments({
      isActive: true,
      fitnessUpTo: { $lt: new Date() },
    });

    res.status(200).json({
      success: true,
      data: {
        totalVehicles,
        serviceStats: serviceStats.reduce(
          (acc, curr) => ({ ...acc, [curr._id]: curr.count }),
          {}
        ),
        stateWiseDistribution: stateStats,
        fitnessExpiredCount: fitnessExpired,
      },
    });
  }
);

/**
 * @desc    Assign vehicle to customer (Admin)
 * @route   PUT /api/customer-dashboard/vehicles/:id/assign
 * @access  Private (Admin)
 */
export const assignVehicleToCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { customerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      res.status(400);
      throw new Error("Invalid customer ID");
    }

    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      res.status(404);
      throw new Error("Customer not found");
    }

    const vehicle = await CustomerDashModel.findByIdAndUpdate(
      id,
      { customer: customerId },
      { new: true }
    ).populate("customer", "firstName lastName phoneNumber");

    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found");
    }

    logger.info(
      `Vehicle ${vehicle.numberPlate} assigned to customer ${customer.phoneNumber}`
    );

    res.status(200).json({
      success: true,
      message: "Vehicle assigned successfully",
      data: vehicle,
    });
  }
);

/**
 * @desc    Transfer vehicle ownership (Admin)
 * @route   PUT /api/customer-dashboard/vehicles/:id/transfer
 * @access  Private (Admin)
 */
export const transferVehicleOwnership = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { newCustomerId, newOwnerName } = req.body;

    const newCustomer = await CustomerModel.findById(newCustomerId);
    if (!newCustomer) {
      res.status(404);
      throw new Error("New customer not found");
    }

    const vehicle = await CustomerDashModel.findByIdAndUpdate(
      id,
      {
        customer: newCustomerId,
        registeredOwnerName: newOwnerName || newCustomer.fullName,
      },
      { new: true }
    ).populate("customer", "firstName lastName phoneNumber");

    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found");
    }

    logger.info(
      `Vehicle ${vehicle.numberPlate} transferred to ${newCustomer.phoneNumber}`
    );

    res.status(200).json({
      success: true,
      message: "Vehicle ownership transferred successfully",
      data: vehicle,
    });
  }
);

/**
 * @desc    Get vehicle service history
 * @route   GET /api/customer-dashboard/vehicles/:vehicleId/service-history
 * @access  Private (Customer or Admin)
 */
export const getVehicleServiceHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const customerId = req.customer?._id;

    const query: any = { _id: vehicleId, isActive: true };

    // If customer is accessing, ensure they own the vehicle
    if (req.customer && !req.user) {
      query.customer = customerId;
    }

    const vehicle = await CustomerDashModel.findOne(query).populate(
      "customer",
      "firstName lastName phoneNumber"
    );

    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found or access denied");
    }

    // Mock service history - in real implementation, this would come from a ServiceHistory model
    const serviceHistory = {
      vehicle: {
        _id: vehicle._id,
        numberPlate: vehicle.numberPlate,
        motorcyclemodelName: vehicle.motorcyclemodelName,
      },
      currentStatus: vehicle.serviceStatus,
      history: [
        // This would be populated from actual service records
        {
          date: vehicle.serviceStatus.lastServiceDate,
          type: "Regular Service",
          kilometers: vehicle.serviceStatus.kilometers,
          description: "Regular maintenance service",
          cost: 2500,
          nextServiceDue: vehicle.serviceStatus.nextServiceDue,
        },
      ],
      totalServices: vehicle.serviceStatus.serviceHistory,
      averageServiceCost: 2500 * vehicle.serviceStatus.serviceHistory,
    };

    res.status(200).json({
      success: true,
      data: serviceHistory,
    });
  }
);
/**
 * @desc    Get customer dashboard overview WITH VAS BADGES
 * @route   GET /api/customer-dashboard
 * @access  Private (Customer)
 */
export const getCustomerDashboard = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = req.customer?._id;

    // Get customer vehicles
    const vehicles = await CustomerDashModel.find({
      customer: customerId,
      isActive: true,
    }).populate("customer", "firstName lastName phoneNumber");

    if (vehicles.length === 0) {
      res.status(404).json({
        success: false,
        message: "No vehicles found for customer",
      });
      return;
    }

    // Get active services for each vehicle
    const vehicleServiceData = await Promise.all(
      vehicles.map(async (vehicle) => {
        // Get active VAS for this vehicle
        const activeServices = await CustomerActiveServiceModel.find({
          vehicle: vehicle._id,
          customer: customerId,
          isActive: true,
          expiryDate: { $gte: new Date() },
        }).populate("service", "serviceName serviceType badges");

        // Extract active badges
        const activeBadges: any[] = [];
        activeServices.forEach((activeService) => {
          const service = activeService.service as any;
          if (service && service.badges) {
            service.badges.forEach((badge: any) => {
              if (
                badge.isActive &&
                activeService.activeBadges.includes(badge._id.toString())
              ) {
                activeBadges.push({
                  id: badge._id,
                  name: badge.name,
                  description: badge.description,
                  icon: badge.icon,
                  color: badge.color,
                  serviceName: service.serviceName,
                  serviceType: service.serviceType,
                });
              }
            });
          }
        });

        return {
          vehicle: {
            _id: vehicle._id,
            motorcyclemodelName: vehicle.motorcyclemodelName,
            numberPlate: vehicle.numberPlate,
            serviceStatus: vehicle.serviceStatus,
          },
          // Add VAS badges to vehicle data
          activeBadges,
          activeServicesCount: activeServices.length,
        };
      })
    );

    // Calculate dashboard stats
    const totalVehicles = vehicles.length;
    const serviceDue = vehicles.filter(
      (v) =>
        v.serviceStatus.serviceType === "Due Soon" ||
        v.serviceStatus.serviceType === "Overdue"
    ).length;
    const fitnessExpiring = vehicles.filter((v) => {
      const daysLeft = Math.ceil(
        (v.fitnessUpTo.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysLeft <= 30 && daysLeft > 0;
    }).length;
    const fitnessExpired = vehicles.filter(
      (v) => v.fitnessUpTo < new Date()
    ).length;

    // Get total active VAS count
    const totalActiveServices = await CustomerActiveServiceModel.countDocuments(
      {
        customer: customerId,
        isActive: true,
        expiryDate: { $gte: new Date() },
      }
    );

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalVehicles,
          serviceDue,
          fitnessExpiring,
          fitnessExpired,
          totalActiveServices,
        },
        vehicles: vehicleServiceData.slice(0, 3), // Show only first 3 for dashboard
        hasMoreVehicles: totalVehicles > 3,
      },
    });
  }
);

/**
 * @desc    Get customer's vehicles WITH BADGES
 * @route   GET /api/customer-dashboard/vehicles
 * @access  Private (Customer)
 */
export const getCustomerVehicles = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = req.customer?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const total = await CustomerDashModel.countDocuments({
      customer: customerId,
      isActive: true,
    });

    const vehicles = await CustomerDashModel.find({
      customer: customerId,
      isActive: true,
    })
      .populate("customer", "firstName lastName phoneNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Add calculated fields and badges
    const vehiclesWithCalcsAndBadges = await Promise.all(
      vehicles.map(async (vehicle) => {
        const vehicleData = vehicle.toObject();
        vehicleData.isFitnessExpired = (vehicle as any).isFitnessExpired();

        // Get active services and badges for this vehicle
        const activeServices = await CustomerActiveServiceModel.find({
          vehicle: vehicle._id,
          customer: customerId,
          isActive: true,
          expiryDate: { $gte: new Date() },
        }).populate("service", "serviceName serviceType badges");

        const activeBadges: any[] = [];
        activeServices.forEach((activeService) => {
          const service = activeService.service as any;
          if (service && service.badges) {
            service.badges.forEach((badge: any) => {
              if (
                badge.isActive &&
                activeService.activeBadges.includes(badge._id.toString())
              ) {
                activeBadges.push({
                  id: badge._id,
                  name: badge.name,
                  description: badge.description,
                  icon: badge.icon,
                  color: badge.color,
                  serviceName: service.serviceName,
                });
              }
            });
          }
        });

        vehicleData.activeBadges = activeBadges;
        vehicleData.activeServicesCount = activeServices.length;

        return vehicleData;
      })
    );

    res.status(200).json({
      success: true,
      count: vehicles.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: vehiclesWithCalcsAndBadges,
    });
  }
);

/**
 * @desc    Get vehicle by ID WITH BADGES
 * @route   GET /api/customer-dashboard/vehicles/:vehicleId
 * @access  Private (Customer or Admin)
 */
export const getCustomerVehicleById = asyncHandler(
  async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const customerId = req.customer?._id;

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      res.status(400);
      throw new Error("Invalid vehicle ID");
    }

    const query: any = { _id: vehicleId, isActive: true };

    // If customer is accessing, ensure they own the vehicle
    if (req.customer && !req.user) {
      query.customer = customerId;
    }

    const vehicle = await CustomerDashModel.findOne(query).populate(
      "customer",
      "firstName lastName phoneNumber email"
    );

    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found or access denied");
    }

    const vehicleData = vehicle.toObject();
    vehicleData.isFitnessExpired = (vehicle as any).isFitnessExpired();

    // Get active services and badges
    const activeServices = await CustomerActiveServiceModel.find({
      vehicle: vehicle._id,
      isActive: true,
      expiryDate: { $gte: new Date() },
    }).populate("service");

    const detailedServices = await Promise.all(
      activeServices.map(async (activeService) => {
        const service = await ValueAddedServiceModel.findById(
          activeService.service
        );
        const activeBadges = service
          ? service.badges.filter(
              (badge: any) =>
                badge.isActive &&
                activeService.activeBadges.includes(badge._id.toString())
            )
          : [];

        return {
          _id: activeService._id,
          serviceName: service?.serviceName,
          serviceType: service?.serviceType,
          activationDate: activeService.activationDate,
          expiryDate: activeService.expiryDate,
          coverageYears: activeService.coverageYears,
          purchasePrice: activeService.purchasePrice,
          activeBadges,
          remainingDays: (activeService as any).getRemainingCoverage(),
        };
      })
    );

    vehicleData.activeServices = detailedServices;

    res.status(200).json({
      success: true,
      data: vehicleData,
    });
  }
);
