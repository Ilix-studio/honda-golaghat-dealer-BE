import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import mongoose from "mongoose";
import ValueAddedServiceModel from "../../../models/BikeSystemModel2/VASmodel";
import { CustomerVehicleModel } from "../../../models/BikeSystemModel2/CustomerVehicleModel";
import logger from "../../../utils/logger";

/**
 * @desc    Activate service for customer (Admin action)
 * @route   POST /api/value-added-services/:id/activate
 * @access  Private (Admin)
 */
export const activateCustomerService = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params; // This is the service ID from URL
    const { customerId, validFrom, validUntil } = req.body;

    // Find service by ID from params
    const service = await ValueAddedServiceModel.findById(id);
    if (!service) {
      res.status(404);
      throw new Error("Service not found");
    }

    // Validate and set service validity dates if provided
    let serviceValidFrom = service.validFrom;
    let serviceValidUntil = service.validUntil;

    if (validFrom || validUntil) {
      const updateData: any = {};

      if (validFrom) {
        const newValidFrom = new Date(validFrom);
        if (isNaN(newValidFrom.getTime())) {
          res.status(400);
          throw new Error("Invalid validFrom date format");
        }
        updateData.validFrom = newValidFrom;
        serviceValidFrom = newValidFrom;
      }

      if (validUntil) {
        const newValidUntil = new Date(validUntil);
        if (isNaN(newValidUntil.getTime())) {
          res.status(400);
          throw new Error("Invalid validUntil date format");
        }
        updateData.validUntil = newValidUntil;
        serviceValidUntil = newValidUntil;
      }

      // Validate date range
      if (
        serviceValidUntil &&
        serviceValidFrom &&
        serviceValidUntil <= serviceValidFrom
      ) {
        res.status(400);
        throw new Error("Valid until date must be after valid from date");
      }

      // Update service with new validity dates
      await ValueAddedServiceModel.findByIdAndUpdate(id, updateData);
    }

    // Check if service is currently valid
    const now = new Date();
    if (
      now < serviceValidFrom ||
      (serviceValidUntil && now > serviceValidUntil)
    ) {
      res.status(400);
      throw new Error("Service is not currently available for activation");
    }

    // Check if service is active
    if (!service.isActive) {
      res.status(400);
      throw new Error("Service is currently inactive");
    }

    // Find vehicle with correct customer
    const vehicle = await CustomerVehicleModel.findOne({
      customer: customerId,
    }).populate("customer", "phoneNumber");

    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found for customer");
    }

    // Check if service is already active for this vehicle
    const existingService = vehicle.activeValueAddedServices.find(
      (vas) =>
        vas.serviceId.toString() === service._id.toString() && vas.isActive
    );

    if (existingService) {
      res.status(400);
      throw new Error("Service is already active for this vehicle");
    }

    // Calculate activation and expiry dates
    const activationDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + service.coverageYears);

    // Ensure expiry doesn't exceed service validity
    if (serviceValidUntil) {
      const serviceExpiryLimit = new Date(serviceValidUntil);
      if (expiryDate > serviceExpiryLimit) {
        expiryDate.setTime(serviceExpiryLimit.getTime());
      }
    }

    const newVAS = {
      serviceId: new mongoose.Types.ObjectId(service._id),
      activatedDate: activationDate,
      expiryDate,
      purchasePrice: service.priceStructure.basePrice,
      coverageYears: service.coverageYears,
      isActive: true,
    };

    vehicle.activeValueAddedServices.push(newVAS);
    await vehicle.save();

    logger.info(
      `Service ${service.serviceName} activated for customer ${
        (vehicle.customer as any)?.phoneNumber
      } vehicle ${vehicle.numberPlate}`
    );

    res.status(200).json({
      success: true,
      message: "Service activated successfully",
      data: {
        serviceId: service._id,
        serviceName: service.serviceName,
        customer: customerId,
        customerPhone: (vehicle.customer as any)?.phoneNumber,
        vehicle: {
          id: vehicle._id,
          numberPlate: vehicle.numberPlate,
          modelName: vehicle.modelName,
        },
        activation: {
          activatedDate: activationDate,
          expiryDate,
          coverageYears: service.coverageYears,
          purchasePrice: newVAS.purchasePrice,
        },
        serviceValidity: {
          validFrom: serviceValidFrom,
          validUntil: serviceValidUntil,
        },
      },
    });
  }
);

/**
 * @desc    Deactivate service for customer (Admin action)
 * @route   PATCH /api/value-added-services/:serviceId/deactivate/:vehicleId
 * @access  Private (Admin)
 */
export const deactivateCustomerService = asyncHandler(
  async (req: Request, res: Response) => {
    const { serviceId, vehicleId } = req.params;
    const { reason } = req.body;

    const vehicle = await CustomerVehicleModel.findById(vehicleId).populate(
      "customer",
      "phoneNumber"
    );

    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found");
    }

    const serviceIndex = vehicle.activeValueAddedServices.findIndex(
      (vas) => vas.serviceId.toString() === serviceId && vas.isActive
    );

    if (serviceIndex === -1) {
      res.status(404);
      throw new Error("Active service not found for this vehicle");
    }

    // Deactivate the service
    vehicle.activeValueAddedServices[serviceIndex].isActive = false;
    await vehicle.save();

    const service = await ValueAddedServiceModel.findById(serviceId);

    logger.info(
      `Service ${service?.serviceName} deactivated for customer ${
        (vehicle.customer as any)?.phoneNumber
      } vehicle ${vehicle.numberPlate}. Reason: ${reason || "Not specified"}`
    );

    res.status(200).json({
      success: true,
      message: "Service deactivated successfully",
      data: {
        serviceId,
        serviceName: service?.serviceName,
        vehicle: vehicle.numberPlate,
        customerPhone: (vehicle.customer as any)?.phoneNumber,
        deactivatedAt: new Date(),
        reason: reason || "Not specified",
      },
    });
  }
);
