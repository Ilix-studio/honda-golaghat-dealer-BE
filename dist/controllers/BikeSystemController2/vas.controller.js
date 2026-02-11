"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomersWithActiveVAS = exports.getCustomerActiveServices = exports.getServicesByType = exports.calculateServicePrice = exports.getCustomerEligibleServices = exports.deleteValueAddedService = exports.updateValueAddedService = exports.getValueAddedServiceById = exports.getAllValueAddedServices = exports.createValueAddedService = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const VASmodel_1 = __importDefault(require("../../models/BikeSystemModel2/VASmodel"));
const logger_1 = __importDefault(require("../../utils/logger"));
const CustomerVehicleModel_1 = require("../../models/BikeSystemModel2/CustomerVehicleModel");
/**
 * @desc    Create value added service
 * @route   POST /api/value-added-services
 * @access  Private (Admin)
 */
/**
 * @desc    Create value added service
 * @route   POST /api/value-added-services
 * @access  Private (Admin)
 */
exports.createValueAddedService = (0, express_async_handler_1.default)(async (req, res) => {
    const { serviceName, coverageYears, priceStructure, benefits, isActive, applicableBranches, } = req.body;
    // Validate required fields
    if (!serviceName || !coverageYears || !(priceStructure === null || priceStructure === void 0 ? void 0 : priceStructure.basePrice)) {
        res.status(400);
        throw new Error("Missing required fields: serviceName, coverageYears, priceStructure.basePrice");
    }
    // Validate benefits array
    if (benefits && (!Array.isArray(benefits) || benefits.length === 0)) {
        res.status(400);
        throw new Error("Benefits must be a non-empty array");
    }
    const serviceData = {
        serviceName: serviceName.trim(),
        coverageYears: Number(coverageYears),
        priceStructure: {
            basePrice: Number(priceStructure.basePrice),
        },
        benefits: benefits || [],
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        applicableBranches: applicableBranches || [],
    };
    const service = await VASmodel_1.default.create(serviceData);
    logger_1.default.info(`Value Added Service created: ${service.serviceName}`);
    res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: service,
    });
});
/**
 * @desc    Get all value added services
 * @route   GET /api/value-added-services/admin
 * @access  Private (Admin)
 */
exports.getAllValueAddedServices = (0, express_async_handler_1.default)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.serviceType)
        filter.serviceType = req.query.serviceType;
    if (req.query.isActive !== undefined)
        filter.isActive = req.query.isActive === "true";
    const total = await VASmodel_1.default.countDocuments(filter);
    const services = await VASmodel_1.default.find(filter)
        .populate("applicableBranches", "branchName address")
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
});
/**
 * @desc    Get service by ID
 * @route   GET /api/value-added-services/admin/:id
 * @access  Private (Admin)
 */
exports.getValueAddedServiceById = (0, express_async_handler_1.default)(async (req, res) => {
    const service = await VASmodel_1.default.findById(req.params.id).populate("applicableBranches", "branchName address");
    if (!service) {
        res.status(404);
        throw new Error("Service not found");
    }
    res.status(200).json({
        success: true,
        data: service,
    });
});
/**
 * @desc    Update value added service
 * @route   PUT /api/value-added-services/admin/:id
 * @access  Private (Admin)
 */
exports.updateValueAddedService = (0, express_async_handler_1.default)(async (req, res) => {
    const service = await VASmodel_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate("applicableBranches", "branchName address");
    if (!service) {
        res.status(404);
        throw new Error("Service not found");
    }
    logger_1.default.info(`Value Added Service updated: ${service.serviceName}`);
    res.status(200).json({
        success: true,
        message: "Service updated successfully",
        data: service,
    });
});
/**
 * @desc    Delete value added service
 * @route   DELETE /api/value-added-services/admin/:id
 * @access  Private (Super-Admin)
 */
exports.deleteValueAddedService = (0, express_async_handler_1.default)(async (req, res) => {
    const service = await VASmodel_1.default.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!service) {
        res.status(404);
        throw new Error("Service not found");
    }
    logger_1.default.warn(`Value Added Service deleted: ${service.serviceName}`);
    res.status(200).json({
        success: true,
        message: "Service deleted successfully",
    });
});
/**
 * @desc    Get eligible services for customer
 * @route   GET /api/value-added-services/eligible
 * @access  Private (Customer)
 */
exports.getCustomerEligibleServices = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const customerId = (_a = req.customer) === null || _a === void 0 ? void 0 : _a._id;
    const vehicles = await CustomerVehicleModel_1.CustomerVehicleModel.find({
        customerPhoneNumber: customerId,
        isActive: true,
    });
    if (vehicles.length === 0) {
        res.status(404).json({
            success: false,
            message: "No vehicles found",
        });
        return;
    }
    const eligibleServices = await Promise.all(vehicles.map(async (vehicle) => {
        // Get vehicle age in months
        const vehicleAgeMonths = Math.floor((new Date().getTime() -
            new Date(vehicle.registrationDate || vehicle.createdAt).getTime()) /
            (1000 * 60 * 60 * 24 * 30));
        // Find eligible services
        const services = await VASmodel_1.default.find({
            isActive: true,
            validFrom: { $lte: new Date() },
            validUntil: { $gte: new Date() },
            maxEnrollmentPeriod: { $gte: vehicleAgeMonths },
        });
        const eligibleForVehicle = services.filter((service) => service.isVehicleEligible(125, "commuter") // Mock data
        );
        return {
            vehicle: {
                _id: vehicle._id,
                numberPlate: vehicle.numberPlate,
                registrationDate: vehicle.registrationDate,
                ageMonths: vehicleAgeMonths,
            },
            eligibleServices: eligibleForVehicle,
        };
    }));
    res.status(200).json({
        success: true,
        data: eligibleServices,
    });
});
/**
 * @desc    Calculate service price
 * @route   POST /api/value-added-services/calculate-price
 * @access  Private (Customer)
 */
exports.calculateServicePrice = (0, express_async_handler_1.default)(async (req, res) => {
    const { serviceId, vehicleId, selectedYears } = req.body;
    const service = await VASmodel_1.default.findById(serviceId);
    const vehicle = await CustomerVehicleModel_1.CustomerVehicleModel.findById(vehicleId);
    if (!service || !vehicle) {
        res.status(404);
        throw new Error("Service or vehicle not found");
    }
    const engineCapacity = 125; // Mock - extract from vehicle data
    const price = service.calculatePrice(engineCapacity, selectedYears);
    res.status(200).json({
        success: true,
        data: {
            service: service.serviceName,
            vehicle: vehicle.numberPlate,
            selectedYears,
            calculatedPrice: price,
        },
    });
});
/**
 * @desc    Get services by type
 * @route   GET /api/value-added-services/types/:serviceType
 * @access  Public
 */
exports.getServicesByType = (0, express_async_handler_1.default)(async (req, res) => {
    const { serviceType } = req.params;
    const services = await VASmodel_1.default.find({
        serviceType,
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
    }).select("serviceName description benefits coverage priceStructure badges");
    res.status(200).json({
        success: true,
        count: services.length,
        data: services,
    });
});
/**
 * @desc    Get customer active services
 * @route   GET /api/value-added-services/my-services
 * @access  Private (Customer)
 */
exports.getCustomerActiveServices = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const customerId = (_a = req.customer) === null || _a === void 0 ? void 0 : _a._id;
    const vehicles = await CustomerVehicleModel_1.CustomerVehicleModel.find({
        customerPhoneNumber: customerId,
        isActive: true,
    })
        .populate("customerPhoneNumber", "phoneNumber")
        .populate("activeValueAddedServices.serviceId", "serviceName serviceType description");
    // Use the activeValueAddedServices array from the vehicle model
    const activeServices = vehicles.map((vehicle) => ({
        vehicle: {
            _id: vehicle._id,
            numberPlate: vehicle.numberPlate,
            customer: customerId,
        },
        services: vehicle.activeValueAddedServices
            .filter((service) => service.isActive)
            .map((service) => {
            var _a, _b;
            return ({
                serviceId: service.serviceId,
                serviceName: (_a = service.serviceId) === null || _a === void 0 ? void 0 : _a.serviceName,
                serviceType: (_b = service.serviceId) === null || _b === void 0 ? void 0 : _b.serviceType,
                activatedDate: service.activatedDate,
                expiryDate: service.expiryDate,
                purchasePrice: service.purchasePrice,
                coverageYears: service.coverageYears,
                isActive: service.isActive,
            });
        }),
    }));
    res.status(200).json({
        success: true,
        data: activeServices,
    });
});
/**
 * @desc    Get all customers with active VAS (Admin)
 * @route   GET /api/value-added-services/admin/customers
 * @access  Private (Admin)
 */
exports.getCustomersWithActiveVAS = (0, express_async_handler_1.default)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const vehicles = await CustomerVehicleModel_1.CustomerVehicleModel.find({
        isActive: true,
        "activeValueAddedServices.0": { $exists: true }, // Has at least one VAS
    })
        .populate("customer", "phoneNumber")
        .populate("activeValueAddedServices.serviceId", "serviceName serviceType")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);
    const total = await CustomerVehicleModel_1.CustomerVehicleModel.countDocuments({
        isActive: true,
        "activeValueAddedServices.0": { $exists: true },
    });
    const customersWithVAS = vehicles.map((vehicle) => {
        var _a, _b;
        return ({
            customer: {
                _id: (_a = vehicle.customer) === null || _a === void 0 ? void 0 : _a._id,
                phoneNumber: (_b = vehicle.customer) === null || _b === void 0 ? void 0 : _b.phoneNumber,
            },
            vehicle: {
                _id: vehicle._id,
                numberPlate: vehicle.numberPlate,
            },
            activeServices: vehicle.activeValueAddedServices
                .filter((service) => service.isActive)
                .map((service) => {
                var _a, _b;
                return ({
                    serviceId: service.serviceId,
                    serviceName: (_a = service.serviceId) === null || _a === void 0 ? void 0 : _a.serviceName,
                    serviceType: (_b = service.serviceId) === null || _b === void 0 ? void 0 : _b.serviceType,
                    activatedDate: service.activatedDate,
                    expiryDate: service.expiryDate,
                    purchasePrice: service.purchasePrice,
                });
            }),
        });
    });
    res.status(200).json({
        success: true,
        count: customersWithVAS.length,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        data: customersWithVAS,
    });
});
