import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import ValueAddedServiceModel from "../../models/BikeSystemModel2/VASmodel";
import logger from "../../utils/logger";
import {
  CustomerVehicleModel,
  ICustomerVehicle,
} from "../../models/BikeSystemModel2/CustomerVehicleModel";

/**
 * @desc    Create value added service
 * @route   POST /api/value-added-services
 * @access  Private (Admin)
 */
export const createValueAddedService = asyncHandler(
  async (req: Request, res: Response) => {
    const service = await ValueAddedServiceModel.create(req.body);

    logger.info(`Value Added Service created: ${service.serviceName}`);

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
    });
  }
);

/**
 * @desc    Get all value added services
 * @route   GET /api/value-added-services/admin
 * @access  Private (Admin)
 */
export const getAllValueAddedServices = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.serviceType) filter.serviceType = req.query.serviceType;
    if (req.query.isActive !== undefined)
      filter.isActive = req.query.isActive === "true";

    const total = await ValueAddedServiceModel.countDocuments(filter);
    const services = await ValueAddedServiceModel.find(filter)
      .populate("applicableBranches", "name address")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: services.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: services,
    });
  }
);

/**
 * @desc    Get service by ID
 * @route   GET /api/value-added-services/admin/:id
 * @access  Private (Admin)
 */
export const getValueAddedServiceById = asyncHandler(
  async (req: Request, res: Response) => {
    const service = await ValueAddedServiceModel.findById(
      req.params.id
    ).populate("applicableBranches", "name address");

    if (!service) {
      res.status(404);
      throw new Error("Service not found");
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  }
);

/**
 * @desc    Update value added service
 * @route   PUT /api/value-added-services/admin/:id
 * @access  Private (Admin)
 */
export const updateValueAddedService = asyncHandler(
  async (req: Request, res: Response) => {
    const service = await ValueAddedServiceModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("applicableBranches", "name address");

    if (!service) {
      res.status(404);
      throw new Error("Service not found");
    }

    logger.info(`Value Added Service updated: ${service.serviceName}`);

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  }
);

/**
 * @desc    Delete value added service
 * @route   DELETE /api/value-added-services/admin/:id
 * @access  Private (Super-Admin)
 */
export const deleteValueAddedService = asyncHandler(
  async (req: Request, res: Response) => {
    const service = await ValueAddedServiceModel.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      res.status(404);
      throw new Error("Service not found");
    }

    logger.warn(`Value Added Service deleted: ${service.serviceName}`);

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  }
);

/**
 * @desc    Toggle badge status
 * @route   PUT /api/value-added-services/admin/:id/badges/:badgeId/toggle
 * @access  Private (Admin)
 */
export const toggleBadgeStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, badgeId } = req.params;

    const service = await ValueAddedServiceModel.findById(id);
    if (!service) {
      res.status(404);
      throw new Error("Service not found");
    }

    const badge = (service.badges as any).id(badgeId);
    if (!badge) {
      res.status(404);
      throw new Error("Badge not found");
    }

    badge.isActive = !badge.isActive;
    await service.save();

    logger.info(
      `Badge ${badge.name} ${
        badge.isActive ? "activated" : "deactivated"
      } for service ${service.serviceName}`
    );

    res.status(200).json({
      success: true,
      message: `Badge ${
        badge.isActive ? "activated" : "deactivated"
      } successfully`,
      data: { badge, service: service.serviceName },
    });
  }
);

/**
 * @desc    Calculate service price
 * @route   POST /api/value-added-services/calculate-price
 * @access  Private (Customer)
 */
export const calculateServicePrice = asyncHandler(
  async (req: Request, res: Response) => {
    const { serviceId, vehicleId, selectedYears } = req.body;

    const service = await ValueAddedServiceModel.findById(serviceId);
    const vehicle = await CustomerVehicleModel.findById(vehicleId);

    if (!service || !vehicle) {
      res.status(404);
      throw new Error("Service or vehicle not found");
    }

    const engineCapacity = 125; // Mock - extract from vehicle data
    const price = (service as any).calculatePrice(
      engineCapacity,
      selectedYears
    );

    res.status(200).json({
      success: true,
      data: {
        service: service.serviceName,
        vehicle: vehicle.numberPlate,
        selectedYears,
        calculatedPrice: price,
        breakdown: {
          basePrice: service.priceStructure.basePrice,
          yearlyPrice: service.priceStructure.pricePerYear * selectedYears,
          multiplier:
            engineCapacity > 125
              ? service.priceStructure.engineCapacityMultiplier
              : 1,
        },
      },
    });
  }
);

/**
 * @desc    Get services by type
 * @route   GET /api/value-added-services/types/:serviceType
 * @access  Public
 */
export const getServicesByType = asyncHandler(
  async (req: Request, res: Response) => {
    const { serviceType } = req.params;

    const services = await ValueAddedServiceModel.find({
      serviceType,
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    }).select(
      "serviceName description benefits coverage priceStructure badges"
    );

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  }
);

/**
 * @desc    Activate service for customer (Admin action)
 * @route   POST /api/value-added-services/admin/activate
 * @access  Private (Admin)
 */
export const activateCustomerService = asyncHandler(
  async (req: Request, res: Response) => {
    const { customerId, vehicleId, serviceId, activeBadges } = req.body;

    const service = await ValueAddedServiceModel.findById(serviceId);
    if (!service) {
      res.status(404);
      throw new Error("Service not found");
    }

    const vehicle = await CustomerVehicleModel.findOne({
      _id: vehicleId,
      customer: customerId,
    });
    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found for customer");
    }

    // Create customer service activation record (you'd need a separate model for this)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + service.coverageYears);

    logger.info(
      `Service ${service.serviceName} activated for customer ${customerId} vehicle ${vehicle.numberPlate}`
    );

    res.status(200).json({
      success: true,
      message: "Service activated successfully",
      data: {
        customer: customerId,
        vehicle: vehicle.numberPlate,
        service: service.serviceName,
        activeBadges: activeBadges || [],
        expiryDate,
      },
    });
  }
);

/**
 * @desc    Get customer active services
 * @route   GET /api/value-added-services/my-services
 * @access  Private (Customer)
 */
export const getCustomerActiveServices = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = req.customer?._id;

    const vehicles = await CustomerVehicleModel.find({
      customer: customerId,
      isActive: true,
    });

    // Use the activeValueAddedServices array from the vehicle model
    const activeServices = vehicles.map((vehicle: ICustomerVehicle) => ({
      vehicle: {
        _id: vehicle._id,
        modelName: vehicle.modelName,
        numberPlate: vehicle.numberPlate,
      },
      services: vehicle.activeValueAddedServices
        .filter((service) => service.isActive)
        .map((service) => ({
          serviceId: service.serviceId,
          activatedDate: service.activatedDate,
          expiryDate: service.expiryDate,
          purchasePrice: service.purchasePrice,
          coverageYears: service.coverageYears,
          activeBadges: service.activeBadges,
        })),
    }));

    res.status(200).json({
      success: true,
      data: activeServices,
    });
  }
);
