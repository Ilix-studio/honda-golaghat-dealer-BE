import asyncHandler from "express-async-handler";
import { Request, Response } from "express";

import mongoose from "mongoose";
import ServiceAddonsModel from "../../../models/BikeSystemModel2/ServiceAddons";
import { BaseCustomerModel } from "../../../models/CustomerSystem/BaseCustomer";
import { CustomerVehicleModel } from "../../../models/BikeSystemModel2/CustomerVehicleModel";
import logger from "../../../utils/logger";

/**
 * @desc    Assign service to customer
 * @route   POST /api/service-addons/:id/assign
 * @access  Private (Admin)
 */
export const activateServiceToCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { customerId, customerVehicleId, purchasePrice } = req.body;

    // Validate service addon exists
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid service addon ID");
    }

    const serviceAddon = await ServiceAddonsModel.findById(id);
    if (!serviceAddon) {
      res.status(404);
      throw new Error("Service addon not found");
    }

    // Validate customer exists
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      res.status(400);
      throw new Error("Invalid customer ID");
    }

    const customer = await BaseCustomerModel.findById(customerId);
    if (!customer) {
      res.status(404);
      throw new Error("Customer not found");
    }

    // Validate vehicle exists and belongs to customer
    if (!mongoose.Types.ObjectId.isValid(customerVehicleId)) {
      res.status(400);
      throw new Error("Invalid vehicle ID");
    }

    const vehicle = await CustomerVehicleModel.findOne({
      _id: customerVehicleId,
      customer: customerId,
      isActive: true,
    });

    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found or doesn't belong to customer");
    }

    // Check if service is already assigned to this vehicle
    const existingService = vehicle.activeValueAddedServices.find(
      (service) => service.serviceId.toString() === id
    );

    if (existingService && existingService.isActive) {
      res.status(400);
      throw new Error("Service already assigned to this vehicle");
    }

    // Assign service to vehicle
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year validity

    vehicle.activeValueAddedServices.push({
      serviceId: new mongoose.Types.ObjectId(id),
      activatedDate: new Date(),
      expiryDate,
      purchasePrice: purchasePrice || serviceAddon.serviceName.cost,
      coverageYears: 1,
      isActive: true,
      activeBadges: [serviceAddon.serviceName.name],
    });

    await vehicle.save();

    logger.info(
      `Service ${serviceAddon.serviceName.name} assigned to customer ${
        customer.phoneNumber
      } for vehicle ${vehicle.numberPlate || vehicle._id}`
    );

    res.status(200).json({
      success: true,
      message: "Service assigned to customer successfully",
      data: {
        customer: {
          id: customer._id,
          phone: customer.phoneNumber,
        },
        vehicle: {
          id: vehicle._id,
          numberPlate: vehicle.numberPlate,
        },
        service: {
          id: serviceAddon._id,
          name: serviceAddon.serviceName.name,
          expiryDate,
        },
      },
    });
  }
);
