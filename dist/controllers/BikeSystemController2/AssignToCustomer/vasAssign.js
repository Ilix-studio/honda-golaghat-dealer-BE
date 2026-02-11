"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateCustomerService = exports.activateCustomerService = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = __importDefault(require("mongoose"));
const VASmodel_1 = __importDefault(require("../../../models/BikeSystemModel2/VASmodel"));
const CustomerVehicleModel_1 = require("../../../models/BikeSystemModel2/CustomerVehicleModel");
const logger_1 = __importDefault(require("../../../utils/logger"));
/**
 * @desc    Activate service for customer (Admin action)
 * @route   POST /api/value-added-services/:id/activate
 * @access  Private (Admin)
 */
exports.activateCustomerService = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    try {
        const { serviceId, customerId } = req.body; // Get both from body
        // Validate ObjectId format
        if (!mongoose_1.default.Types.ObjectId.isValid(serviceId)) {
            res.status(400);
            throw new Error("Invalid service ID format");
        }
        // Validate required fields
        if (!customerId) {
            res.status(400);
            throw new Error("Customer ID is required");
        }
        // Validate customer ID format
        if (!mongoose_1.default.Types.ObjectId.isValid(customerId)) {
            res.status(400);
            throw new Error("Invalid customer ID format");
        }
        // Find service with detailed error information
        const service = await VASmodel_1.default.findById(serviceId);
        if (!service) {
            logger_1.default.warn(`Service not found with ID: ${serviceId}`);
            res.status(404);
            throw new Error("Service not found");
        }
        if (!service.isActive) {
            logger_1.default.warn(`Service inactive with ID: ${serviceId}, serviceName: ${service.serviceName}`);
            res.status(400);
            throw new Error("Service is currently inactive");
        }
        // Check service validity period
        const now = new Date();
        if (service.validFrom && service.validFrom > now) {
            res.status(400);
            throw new Error("Service is not yet available");
        }
        if (service.validUntil && service.validUntil < now) {
            res.status(400);
            throw new Error("Service has expired");
        }
        // Find customer's vehicle with better error handling
        const vehicle = await CustomerVehicleModel_1.CustomerVehicleModel.findOne({
            customer: customerId,
            isActive: true,
        }).populate("customer", "phoneNumber");
        if (!vehicle) {
            logger_1.default.warn(`No active vehicle found for customer: ${customerId}`);
            res.status(404);
            throw new Error("No active vehicle found for this customer");
        }
        // Check if service already active
        const existingService = vehicle.activeValueAddedServices.find((vas) => vas.serviceId.toString() === serviceId && vas.isActive);
        if (existingService) {
            res.status(400);
            throw new Error("Service already active for this vehicle");
        }
        // Activate service
        const activationDate = new Date();
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + service.coverageYears);
        const newVAS = {
            serviceId: new mongoose_1.default.Types.ObjectId(serviceId),
            activatedDate: activationDate,
            expiryDate,
            purchasePrice: service.priceStructure.basePrice,
            coverageYears: service.coverageYears,
            isActive: true,
        };
        vehicle.activeValueAddedServices.push(newVAS);
        await vehicle.save();
        logger_1.default.info(`Service ${service.serviceName} activated for customer ${(_a = vehicle.customer) === null || _a === void 0 ? void 0 : _a.phoneNumber} vehicle ${vehicle.numberPlate}`);
        res.status(200).json({
            success: true,
            message: "Service activated successfully",
            data: {
                serviceId: serviceId,
                serviceName: service.serviceName,
                customer: customerId,
                vehicle: vehicle._id,
                activation: {
                    activatedDate: activationDate,
                    expiryDate,
                    purchasePrice: newVAS.purchasePrice,
                },
            },
        });
    }
    catch (error) {
        logger_1.default.error("VAS Activation Error:", {
            serviceId: req.body.serviceId,
            customerId: req.body.customerId,
        });
        throw error; // Re-throw to be handled by asyncHandler
    }
});
//Hello
/**
 * @desc    Deactivate service for customer (Admin action)
 * @route   PATCH /api/value-added-services/:serviceId/deactivate/:vehicleId
 * @access  Private (Admin)
 */
exports.deactivateCustomerService = (0, express_async_handler_1.default)(async (req, res) => {
    var _a, _b;
    const { serviceId, vehicleId } = req.params;
    const { reason } = req.body;
    const vehicle = await CustomerVehicleModel_1.CustomerVehicleModel.findById(vehicleId).populate("customer", "phoneNumber");
    if (!vehicle) {
        res.status(404);
        throw new Error("Vehicle not found");
    }
    const serviceIndex = vehicle.activeValueAddedServices.findIndex((vas) => vas.serviceId.toString() === serviceId && vas.isActive);
    if (serviceIndex === -1) {
        res.status(404);
        throw new Error("Active service not found for this vehicle");
    }
    // Deactivate the service
    vehicle.activeValueAddedServices[serviceIndex].isActive = false;
    await vehicle.save();
    const service = await VASmodel_1.default.findById(serviceId);
    logger_1.default.info(`Service ${service === null || service === void 0 ? void 0 : service.serviceName} deactivated for customer ${(_a = vehicle.customer) === null || _a === void 0 ? void 0 : _a.phoneNumber} vehicle ${vehicle.numberPlate}. Reason: ${reason || "Not specified"}`);
    res.status(200).json({
        success: true,
        message: "Service deactivated successfully",
        data: {
            serviceId,
            serviceName: service === null || service === void 0 ? void 0 : service.serviceName,
            vehicle: vehicle.numberPlate,
            customerPhone: (_b = vehicle.customer) === null || _b === void 0 ? void 0 : _b.phoneNumber,
            deactivatedAt: new Date(),
            reason: reason || "Not specified",
        },
    });
});
//What is happening in server
