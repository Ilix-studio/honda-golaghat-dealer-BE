"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferVehicle = exports.getVehicleStats = exports.getServiceDueVehicles = exports.updateServiceStatus = exports.deleteVehicle = exports.updateVehicle = exports.createVehicleFromStock = exports.getVehicleById = exports.getMyVehicles = exports.getAllCustomerVehicles = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../../utils/logger"));
// Fixed import
const BaseCustomer_1 = require("../../models/CustomerSystem/BaseCustomer");
const CustomerVehicleModel_1 = require("../../models/BikeSystemModel2/CustomerVehicleModel");
/**
 * @desc    Get all customer vehicles (Admin)
 * @route   GET /api/customer-vehicles
 * @access  Private (Admin)
 */
exports.getAllCustomerVehicles = (0, express_async_handler_1.default)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    // Build filter based on CustomerVehicle model structure
    const filter = { isActive: true };
    if (req.query.serviceType) {
        filter["serviceStatus.serviceType"] = req.query.serviceType;
    }
    const vehicles = await CustomerVehicleModel_1.CustomerVehicleModel.find(filter)
        .populate("customer", "phoneNumber")
        .populate("servicePackage.packageId")
        .populate("activeValueAddedServices.serviceId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const total = await CustomerVehicleModel_1.CustomerVehicleModel.countDocuments(filter);
    res.status(200).json({
        success: true,
        count: vehicles.length,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        data: vehicles,
    });
});
/**
 * @desc    Get customer's own vehicles
 * @route   GET /api/customer-vehicles/my-vehicles
 * @access  Private (Customer)
 */
exports.getMyVehicles = (0, express_async_handler_1.default)(async (req, res) => {
    var _a, _b, _c;
    console.log("🚗 getMyVehicles from customerVehicle.controller called");
    console.log("Customer ID:", (_a = req.customer) === null || _a === void 0 ? void 0 : _a._id);
    const customerPhone = (_b = req.customer) === null || _b === void 0 ? void 0 : _b.phoneNumber;
    // Query CustomerVehicle directly, not StockConcept
    const vehicles = await CustomerVehicleModel_1.CustomerVehicleModel.find({
        customer: (_c = req.customer) === null || _c === void 0 ? void 0 : _c._id, // Use customer ObjectId instead of phone
        isActive: true,
    })
        .populate({
        path: "stockConcept",
        select: "stockId modelName category engineCC color variant yearOfManufacture engineNumber chassisNumber priceInfo",
    })
        .sort({ createdAt: -1 });
    console.log("Found vehicles:", vehicles.length);
    res.status(200).json({
        success: true,
        count: vehicles.length,
        data: vehicles,
    });
});
/**
 * @desc    Get vehicle by ID
 * @route   GET /api/customer-vehicles/:id
 * @access  Private (Customer/Admin)
 */
exports.getVehicleById = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid vehicle ID");
    }
    const vehicle = await CustomerVehicleModel_1.CustomerVehicleModel.findById(id)
        .populate("customer", "phoneNumber")
        .populate("activeValueAddedServices.serviceId");
    if (!vehicle) {
        res.status(404);
        throw new Error("Vehicle not found");
    }
    // Check if customer is accessing their own vehicle
    if (req.customer &&
        vehicle.customer._id.toString() !== req.customer._id.toString()) {
        res.status(403);
        throw new Error("Access denied");
    }
    res.status(200).json({
        success: true,
        data: vehicle,
    });
});
/**
 * @desc    Create new vehicle from stock
 * @route   POST /api/customer-vehicles/create-from-stock
 * @access  Private (Admin)
 */
exports.createVehicleFromStock = (0, express_async_handler_1.default)(async (req, res) => {
    var _a, _b;
    const { customerPhoneNumber, registrationDate, insurance, isPaid, isFinance, color, purchaseDate, numberPlate, registeredOwnerName, motorcyclePhoto, rtoInfo, servicePackageId, } = req.body;
    // Validate customer exists
    const customerExists = await BaseCustomer_1.BaseCustomerModel.findById(customerPhoneNumber);
    if (!customerExists) {
        res.status(404);
        throw new Error("Customer not found");
    }
    // Check for duplicates using numberPlate if provided
    if (numberPlate) {
        const existingVehicle = await CustomerVehicleModel_1.CustomerVehicleModel.findOne({
            numberPlate: numberPlate.toUpperCase(),
        });
        if (existingVehicle) {
            res.status(400);
            throw new Error("Vehicle with this number plate already exists");
        }
    }
    const vehicle = await CustomerVehicleModel_1.CustomerVehicleModel.create({
        registrationDate,
        insurance,
        isPaid,
        isFinance,
        color,
        purchaseDate,
        customerPhoneNumber,
        numberPlate: numberPlate === null || numberPlate === void 0 ? void 0 : numberPlate.toUpperCase(),
        registeredOwnerName,
        motorcyclePhoto,
        rtoInfo: rtoInfo
            ? {
                rtoCode: (_a = rtoInfo.rtoCode) === null || _a === void 0 ? void 0 : _a.toUpperCase(),
                rtoName: rtoInfo.rtoName,
                rtoAddress: rtoInfo.rtoAddress,
                state: (_b = rtoInfo.state) === null || _b === void 0 ? void 0 : _b.toUpperCase(),
            }
            : undefined,
        servicePackage: {
            packageId: new mongoose_1.default.Types.ObjectId(servicePackageId),
            currentServiceLevel: 1,
            nextServiceType: "firstService",
            completedServices: [],
        },
        serviceStatus: {
            kilometers: 0,
            serviceHistory: 0,
        },
        activeValueAddedServices: [],
        isActive: true,
    });
    await vehicle.populate([
        { path: "customer", select: "phoneNumber" },
        { path: "servicePackage.packageId" },
    ]);
    logger_1.default.info(`Vehicle created for customer ${customerExists.phoneNumber}`);
    res.status(201).json({
        success: true,
        message: "Vehicle created successfully",
        data: vehicle,
    });
});
/**
 * @desc    Update vehicle
 * @route   PUT /api/customer-vehicles/:id
 * @access  Private (Admin)
 */
exports.updateVehicle = (0, express_async_handler_1.default)(async (req, res) => {
    var _a, _b;
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid vehicle ID");
    }
    const vehicle = await CustomerVehicleModel_1.CustomerVehicleModel.findById(id);
    if (!vehicle) {
        res.status(404);
        throw new Error("Vehicle not found");
    }
    // Check for duplicates if updating numberPlate
    const { numberPlate, rtoInfo, ...otherUpdates } = req.body;
    if (numberPlate && numberPlate !== vehicle.numberPlate) {
        const duplicate = await CustomerVehicleModel_1.CustomerVehicleModel.findOne({
            _id: { $ne: id },
            numberPlate: numberPlate.toUpperCase(),
        });
        if (duplicate) {
            res.status(400);
            throw new Error("Another vehicle with this number plate already exists");
        }
    }
    // Prepare update data
    const updateData = { ...otherUpdates };
    if (numberPlate)
        updateData.numberPlate = numberPlate.toUpperCase();
    if (rtoInfo) {
        updateData.rtoInfo = {
            rtoCode: (_a = rtoInfo.rtoCode) === null || _a === void 0 ? void 0 : _a.toUpperCase(),
            rtoName: rtoInfo.rtoName,
            rtoAddress: rtoInfo.rtoAddress,
            state: (_b = rtoInfo.state) === null || _b === void 0 ? void 0 : _b.toUpperCase(),
        };
    }
    const updatedVehicle = await CustomerVehicleModel_1.CustomerVehicleModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate("customer", "phoneNumber");
    logger_1.default.info(`Vehicle updated by admin`);
    res.status(200).json({
        success: true,
        message: "Vehicle updated successfully",
        data: updatedVehicle,
    });
});
/**
 * @desc    Delete vehicle
 * @route   DELETE /api/customer-vehicles/:id
 * @access  Private (Admin)
 */
exports.deleteVehicle = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid vehicle ID");
    }
    const vehicle = await CustomerVehicleModel_1.CustomerVehicleModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!vehicle) {
        res.status(404);
        throw new Error("Vehicle not found");
    }
    logger_1.default.info(`Vehicle soft deleted`);
    res.status(200).json({
        success: true,
        message: "Vehicle deleted successfully",
    });
});
/**
 * @desc    Update vehicle service status
 * @route   PUT /api/customer-vehicles/:id/service-status
 * @access  Private (Admin)
 */
exports.updateServiceStatus = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid vehicle ID");
    }
    const vehicle = await CustomerVehicleModel_1.CustomerVehicleModel.findById(id);
    if (!vehicle) {
        res.status(404);
        throw new Error("Vehicle not found");
    }
    await vehicle.save();
    const updatedVehicle = await CustomerVehicleModel_1.CustomerVehicleModel.findById(id).populate("customer", "phoneNumber");
    res.status(200).json({
        success: true,
        message: "Service status updated successfully",
        data: updatedVehicle,
    });
});
/**
 * @desc    Get vehicles requiring service
 * @route   GET /api/customer-vehicles/service-due
 * @access  Private (Admin)
 */
exports.getServiceDueVehicles = (0, express_async_handler_1.default)(async (req, res) => {
    const currentDate = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(currentDate.getDate() + 7);
    const vehicles = await CustomerVehicleModel_1.CustomerVehicleModel.find({
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
        .populate("customer", "phoneNumber")
        .sort({ "serviceStatus.nextServiceDue": 1 });
    res.status(200).json({
        success: true,
        count: vehicles.length,
        data: vehicles,
    });
});
/**
 * @desc    Get vehicle statistics
 * @route   GET /api/customer-vehicles/stats
 * @access  Private (Admin)
 */
exports.getVehicleStats = (0, express_async_handler_1.default)(async (req, res) => {
    const totalVehicles = await CustomerVehicleModel_1.CustomerVehicleModel.countDocuments({
        isActive: true,
    });
    const serviceStats = await CustomerVehicleModel_1.CustomerVehicleModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$serviceStatus.serviceType", count: { $sum: 1 } } },
    ]);
    const insuranceStats = await CustomerVehicleModel_1.CustomerVehicleModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$insurance", count: { $sum: 1 } } },
    ]);
    const paymentStats = await CustomerVehicleModel_1.CustomerVehicleModel.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: { isPaid: "$isPaid", isFinance: "$isFinance" },
                count: { $sum: 1 },
            },
        },
    ]);
    res.status(200).json({
        success: true,
        data: {
            totalVehicles,
            serviceStats: serviceStats.reduce((acc, curr) => ({
                ...acc,
                [curr._id]: curr.count,
            }), {}),
            insuranceStats: insuranceStats.reduce((acc, curr) => ({
                ...acc,
                [curr._id ? "insured" : "notInsured"]: curr.count,
            }), {}),
            paymentStats: paymentStats.reduce((acc, curr) => ({
                ...acc,
                [`paid_${curr._id.isPaid}_finance_${curr._id.isFinance}`]: curr.count,
            }), {}),
        },
    });
});
/**
 * @desc    Transfer vehicle ownership
 * @route   PUT /api/customer-vehicles/:id/transfer
 * @access  Private (Admin)
 */
exports.transferVehicle = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { newCustomerId, newOwnerName } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(id) ||
        !mongoose_1.default.Types.ObjectId.isValid(newCustomerId)) {
        res.status(400);
        throw new Error("Invalid vehicle or customer ID");
    }
    const newCustomer = await BaseCustomer_1.BaseCustomerModel.findById(newCustomerId);
    if (!newCustomer) {
        res.status(404);
        throw new Error("New customer not found");
    }
    const vehicle = await CustomerVehicleModel_1.CustomerVehicleModel.findByIdAndUpdate(id, {
        customer: newCustomerId,
        registeredOwnerName: newOwnerName || undefined,
    }, { new: true }).populate("customer", "phoneNumber");
    if (!vehicle) {
        res.status(404);
        throw new Error("Vehicle not found");
    }
    logger_1.default.info(`Vehicle transferred to ${newCustomer.phoneNumber}`);
    res.status(200).json({
        success: true,
        message: "Vehicle ownership transferred successfully",
        data: vehicle,
    });
});
