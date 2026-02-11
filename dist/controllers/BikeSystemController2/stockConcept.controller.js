"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVehicleById = exports.getMyVehicles = exports.getStockItemById = exports.getAllStockItems = exports.createStockItem = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = __importDefault(require("mongoose"));
const StockConcept_1 = require("../../models/BikeSystemModel2/StockConcept");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * @desc    Create new stock item
 * @route   POST /api/stock-concept
 * @access  Private (Super-Admin, Branch-Admin)
 */
exports.createStockItem = (0, express_async_handler_1.default)(async (req, res) => {
    const { modelName, category, engineCC, engineNumber, chassisNumber, color, variant, yearOfManufacture, exShowroomPrice, roadTax = 0, branchId, location = "Warehouse", uniqueBookRecord, } = req.body;
    // Validate required fields
    if (!modelName ||
        !category ||
        !engineCC ||
        !engineNumber ||
        !chassisNumber ||
        !color ||
        !variant ||
        !yearOfManufacture ||
        !exShowroomPrice ||
        !branchId) {
        res.status(400);
        throw new Error("Please provide all required fields");
    }
    // Generate stock ID
    const stockCount = await StockConcept_1.StockConceptModel.countDocuments();
    const stockId = `STK-${Date.now()}-${String(stockCount + 1).padStart(4, "0")}`;
    // Calculate pricing
    const onRoadPrice = exShowroomPrice + roadTax;
    // Create stock item
    const stockItem = await StockConcept_1.StockConceptModel.create({
        stockId,
        modelName,
        category,
        engineCC,
        color,
        variant,
        yearOfManufacture,
        uniqueBookRecord,
        engineNumber: engineNumber.toUpperCase(),
        chassisNumber: chassisNumber.toUpperCase(),
        stockStatus: {
            status: "Available",
            location,
            branchId,
            lastUpdated: new Date(),
            updatedBy: req.user._id,
        },
        priceInfo: {
            exShowroomPrice,
            roadTax,
            onRoadPrice,
        },
    });
    await stockItem.populate([
        { path: "stockStatus.branchId", select: "branchName address" },
    ]);
    logger_1.default.info(`Stock item created: ${stockItem.stockId} by ${req.user._id}`);
    res.status(201).json({
        success: true,
        message: "Stock item created successfully",
        data: stockItem,
    });
});
/**
 * @desc    Get all stock items
 * @route   GET /api/stock-concept
 * @access  Private (Super-Admin, Branch-Admin)
 */
exports.getAllStockItems = (0, express_async_handler_1.default)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    // Build filter
    const filter = { isActive: true };
    if (req.query.status) {
        filter["stockStatus.status"] = req.query.status;
    }
    if (req.query.location) {
        filter["stockStatus.location"] = req.query.location;
    }
    if (req.query.branchId) {
        filter["stockStatus.branchId"] = req.query.branchId;
    }
    if (req.query.category) {
        filter["category"] = req.query.category;
    }
    if (req.query.fuelType) {
        filter["fuelType"] = req.query.fuelType;
    }
    // Search functionality
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, "i");
        filter.$or = [
            { stockId: searchRegex },
            { modelName: searchRegex },
            { engineNumber: searchRegex },
            { chassisNumber: searchRegex },
        ];
    }
    const total = await StockConcept_1.StockConceptModel.countDocuments(filter);
    const stockItems = await StockConcept_1.StockConceptModel.find(filter)
        .populate("stockStatus.branchId", "branchName address")
        .populate("salesInfo.soldTo", "phoneNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    res.status(200).json({
        success: true,
        count: stockItems.length,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        data: stockItems,
    });
});
exports.getStockItemById = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid stock item ID");
    }
    const stockItem = await StockConcept_1.StockConceptModel.findById(id).populate("stockStatus.branchId", "branchName address phone");
    if (!stockItem) {
        res.status(404);
        throw new Error("Stock item not found");
    }
    res.status(200).json({
        success: true,
        data: stockItem,
    });
});
/**
 * @desc    Get customer's vehicles (stock items sold to them)
 * @route   GET /api/stock-concept/my-vehicles
 * @access  Private (Customer)
 */
exports.getMyVehicles = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const customerId = (_a = req.customer) === null || _a === void 0 ? void 0 : _a._id;
    if (!customerId) {
        res.status(401);
        throw new Error("Customer authentication required");
    }
    // Find all stock items sold to this customer
    const vehicles = await StockConcept_1.StockConceptModel.find({
        "salesInfo.soldTo": customerId,
        "stockStatus.status": "Sold",
        isActive: true,
    })
        .populate("stockStatus.branchId", "branchName address")
        .populate("salesInfo.salesPerson", "name email")
        .populate("salesInfo.customerVehicleId")
        .sort({ "salesInfo.soldDate": -1 });
    res.status(200).json({
        success: true,
        count: vehicles.length,
        data: vehicles,
    });
});
/**
 * @desc    Get vehicle by ID (for customer dashboard)
 * @route   GET /api/
 * @access  Private (Customer/Admin)
 */
exports.getVehicleById = (0, express_async_handler_1.default)(async (req, res) => {
    var _a, _b, _c;
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid vehicle ID");
    }
    const vehicle = await StockConcept_1.StockConceptModel.findById(id)
        .populate("stockStatus.branchId", "branchName address")
        .populate("salesInfo.soldTo", "phoneNumber firstName lastName")
        .populate("salesInfo.salesPerson", "name email")
        .populate("salesInfo.customerVehicleId")
        .populate("salesHistory.soldTo", "phoneNumber firstName lastName")
        .populate("salesHistory.salesPerson", "name email");
    if (!vehicle) {
        res.status(404);
        throw new Error("Vehicle not found");
    }
    // Check if customer is accessing their own vehicle
    if (req.customer) {
        const isOwner = ((_c = (_b = (_a = vehicle.salesInfo) === null || _a === void 0 ? void 0 : _a.soldTo) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString()) ===
            req.customer._id.toString();
        if (!isOwner) {
            res.status(403);
            throw new Error("Access denied: You can only view your own vehicles");
        }
    }
    res.status(200).json({
        success: true,
        data: vehicle,
    });
});
