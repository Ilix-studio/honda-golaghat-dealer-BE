import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import mongoose from "mongoose";
import ValueAddedServiceModel from "../../../models/BikeSystemModel2/VASmodel";
import { CustomerVehicleModel } from "../../../models/BikeSystemModel2/CustomerVehicleModel";
import logger from "../../../utils/logger";
/**
 * @desc    Activate service for customer (Admin action)
 * @route   POST /api/value-added-services/admin/activate
 * @access  Private (Admin)
 */
export const activateCustomerService = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { customerId, serviceId, activeBadges, purchasePrice } = req.body;

    // Find service
    const service = await ValueAddedServiceModel.findById(serviceId);
    if (!service) {
      res.status(404);
      throw new Error("Service not found");
    }

    // Find vehicle with correct customer
    const vehicle = await CustomerVehicleModel.findOne({
      customer: customerId,
    }).populate("customer", "phoneNumber");

    if (!vehicle) {
      res.status(404);
      throw new Error("Vehicle not found for customer");
    }

    // Rest of the function
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + service.coverageYears);

    const newVAS = {
      serviceId: new mongoose.Types.ObjectId(service._id),
      activatedDate: new Date(),
      expiryDate,
      purchasePrice: Number(purchasePrice) || 0,
      coverageYears: service.coverageYears,
      isActive: true,
      activeBadges: activeBadges || [],
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
        customer: customerId,
        customerPhone: (vehicle.customer as any)?.phoneNumber,
        vehicle: vehicle.numberPlate,
        service: service.serviceName,
        activeBadges: activeBadges || [],
        expiryDate,
        purchasePrice: purchasePrice || 0,
      },
    });
  }
);
