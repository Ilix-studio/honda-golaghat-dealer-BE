"use strict";
// controllers/BikeSystemController2/csvStockImport.controller.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unassignCSVStock = exports.deleteCSVStock = exports.updateCSVStockStatus = exports.getStocksByBatch = exports.getCSVBatches = exports.getCSVStockByStockId = exports.getStocksByCSVBatch = exports.assignCSVStockToCustomer = exports.getCSVStocks = exports.importCSVStock = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const csv_parse_1 = require("csv-parse");
const csvSchemaDetector_1 = require("../../utils/csvSchemaDetector");
const StockConceptCSV_1 = require("../../models/BikeSystemModel3/StockConceptCSV");
const mongoose_1 = __importStar(require("mongoose"));
const StockConcept_1 = require("../../models/BikeSystemModel2/StockConcept");
const CustomerVehicleModel_1 = require("../../models/BikeSystemModel2/CustomerVehicleModel");
exports.importCSVStock = (0, express_async_handler_1.default)(async (req, res) => {
    var _a, _b, _c;
    const file = req.file;
    const { defaultBranchId } = req.body;
    if (!file) {
        res.status(400);
        throw new Error("CSV file required");
    }
    if (!defaultBranchId) {
        res.status(400);
        throw new Error("defaultBranchId required");
    }
    // Change parse implementation to:
    const records = await new Promise((resolve, reject) => {
        (0, csv_parse_1.parse)(file.buffer, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }, (err, output) => {
            if (err)
                reject(err);
            else
                resolve(output);
        });
    });
    // Detect schema
    const schema = (0, csvSchemaDetector_1.detectCSVSchema)(records);
    // Generate batch ID
    const batchId = `CSV-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;
    const importDate = new Date();
    const results = {
        success: false,
        totalRows: records.length,
        successCount: 0,
        failureCount: 0,
        batchId,
        detectedColumns: schema.columns,
        errors: [],
        created: [],
    };
    // Process records
    for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2;
        try {
            // Extract core fields using detected mappings
            const modelName = row[schema.mappings.modelName];
            const engineNumber = (_a = row[schema.mappings.engineNumber]) === null || _a === void 0 ? void 0 : _a.toUpperCase();
            const chassisNumber = (_b = row[schema.mappings.chassisNumber]) === null || _b === void 0 ? void 0 : _b.toUpperCase();
            const color = row[schema.mappings.color];
            const location = ((_c = row[schema.mappings.location]) === null || _c === void 0 ? void 0 : _c.toUpperCase()) || "WAREHOUSE";
            if (!engineNumber || !chassisNumber) {
                throw new Error("Engine/Chassis number missing");
            }
            // Check duplicates across BOTH models
            const [existingCSV, existingStock] = await Promise.all([
                StockConceptCSV_1.StockConceptCSVModel.findOne({
                    $or: [{ engineNumber }, { chassisNumber }],
                }),
                mongoose_1.default.model("StockConcept").findOne({
                    $or: [{ engineNumber }, { chassisNumber }],
                }),
            ]);
            if (existingCSV || existingStock) {
                throw new Error(`Duplicate: ${engineNumber || chassisNumber}`);
            }
            // Generate stock ID
            const stockCount = await StockConceptCSV_1.StockConceptCSVModel.countDocuments();
            const stockId = `CSV-${Date.now()}-${String(stockCount + 1).padStart(4, "0")}`;
            // Create with ALL CSV data
            const csvStock = await StockConceptCSV_1.StockConceptCSVModel.create({
                stockId,
                modelName,
                engineNumber,
                chassisNumber,
                color,
                csvImportBatch: batchId,
                csvImportDate: importDate,
                csvFileName: file.originalname,
                // Store ALL columns dynamically
                csvData: row,
                detectedColumns: schema.columns,
                schemaVersion: 1,
                stockStatus: {
                    status: "Available",
                    location,
                    branchId: defaultBranchId,
                    updatedBy: req.user._id,
                },
            });
            results.created.push(csvStock.stockId);
            results.successCount++;
        }
        catch (error) {
            results.failureCount++;
            results.errors.push({
                row: rowNumber,
                data: row,
                error: error instanceof Error ? error.message : "Unknown",
            });
        }
    }
    results.success = results.failureCount === 0;
    res.status(results.success ? 201 : 207).json({
        success: true,
        message: `Imported ${results.successCount}/${results.totalRows}`,
        data: results,
    });
});
// Get all CSV stocks
exports.getCSVStocks = (0, express_async_handler_1.default)(async (req, res) => {
    const { page = 1, limit = 20, batchId, status, location } = req.query;
    const query = {};
    if (batchId)
        query.csvImportBatch = batchId;
    if (status)
        query["stockStatus.status"] = status;
    if (location)
        query["stockStatus.location"] = location;
    const skip = (Number(page) - 1) * Number(limit);
    const [stocks, total] = await Promise.all([
        StockConceptCSV_1.StockConceptCSVModel.find(query)
            .populate("stockStatus.branchId", "branchName")
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 }),
        StockConceptCSV_1.StockConceptCSVModel.countDocuments(query),
    ]);
    res.json({
        success: true,
        data: stocks,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
});
exports.assignCSVStockToCustomer = (0, express_async_handler_1.default)(async (req, res) => {
    const { stockId } = req.params;
    const { stockType, // "manual" | "csv"
    customerId, salePrice, invoiceNumber, paymentStatus = "Paid", registrationDate, numberPlate, registeredOwnerName, insurance = false, isPaid = false, isFinance = false, } = req.body;
    if (!["manual", "csv"].includes(stockType)) {
        res.status(400);
        throw new Error("stockType must be 'manual' or 'csv'");
    }
    // Select model based on type
    const StockModel = stockType === "csv" ? StockConceptCSV_1.StockConceptCSVModel : StockConcept_1.StockConceptModel;
    // With type guard approach:
    const stock = stockType === "csv"
        ? await StockConceptCSV_1.StockConceptCSVModel.findOne({ stockId }).exec()
        : await StockConcept_1.StockConceptModel.findOne({ stockId }).exec();
    if (!stock) {
        res.status(404);
        throw new Error(`${stockType} stock not found`);
    }
    if (stock.stockStatus.status !== "Available") {
        res.status(400);
        throw new Error("Stock not available");
    }
    // Create CustomerVehicle (works with both models)
    const customerVehicle = await CustomerVehicleModel_1.CustomerVehicleModel.create({
        stockConcept: stock._id, // Reference works for both
        customer: customerId,
        registrationDate,
        numberPlate,
        registeredOwnerName,
        isPaid,
        isFinance,
        insurance,
    });
    // Update stock
    stock.stockStatus.status = "Sold";
    stock.salesInfo = {
        soldTo: new mongoose_1.Types.ObjectId(customerId), // Convert string to ObjectId
        soldDate: new Date(),
        salePrice,
        invoiceNumber,
        paymentStatus,
    };
    await stock.save();
    res.status(200).json({
        success: true,
        message: "Stock assigned successfully",
        data: {
            stockType,
            stock,
            customerVehicle,
        },
    });
});
/**
 * @desc    Get stocks from specific CSV batch
 * @route   GET /api/stock-concept/csv-batch/:batchId
 * @access  Private (Admin)
 */
exports.getStocksByCSVBatch = (0, express_async_handler_1.default)(async (req, res) => {
    const { batchId } = req.params;
    const stocks = await StockConcept_1.StockConceptModel.find({
        csvImportBatch: batchId,
    })
        .populate("stockStatus.branchId", "branchName address")
        .sort({ createdAt: 1 });
    if (stocks.length === 0) {
        res.status(404);
        throw new Error("No stocks found for this batch ID");
    }
    res.status(200).json({
        success: true,
        batchId,
        count: stocks.length,
        data: stocks,
    });
});
// Get single CSV stock
exports.getCSVStockByStockId = (0, express_async_handler_1.default)(async (req, res) => {
    const { stockId } = req.params;
    const stock = await StockConceptCSV_1.StockConceptCSVModel.findOne({ stockId })
        .populate("stockStatus.branchId", "branchName address")
        .populate("salesInfo.soldTo", "fullName phoneNumber")
        .populate("salesInfo.customerVehicleId");
    if (!stock) {
        res.status(404);
        throw new Error("CSV stock not found");
    }
    res.json({
        success: true,
        data: stock,
    });
});
// Get CSV batches (folders)
exports.getCSVBatches = (0, express_async_handler_1.default)(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const batches = await StockConceptCSV_1.StockConceptCSVModel.aggregate([
        {
            $group: {
                _id: "$csvImportBatch",
                fileName: { $first: "$csvFileName" },
                importDate: { $first: "$csvImportDate" },
                totalStocks: { $sum: 1 },
                availableStocks: {
                    $sum: {
                        $cond: [{ $eq: ["$stockStatus.status", "Available"] }, 1, 0],
                    },
                },
                soldStocks: {
                    $sum: {
                        $cond: [{ $eq: ["$stockStatus.status", "Sold"] }, 1, 0],
                    },
                },
                models: { $addToSet: "$modelName" },
                locations: { $addToSet: "$stockStatus.location" },
            },
        },
        { $sort: { importDate: -1 } },
        { $skip: skip },
        { $limit: Number(limit) },
    ]);
    const totalBatches = await StockConceptCSV_1.StockConceptCSVModel.distinct("csvImportBatch");
    res.json({
        success: true,
        data: batches.map((b) => ({
            batchId: b._id,
            fileName: b.fileName,
            importDate: b.importDate,
            totalStocks: b.totalStocks,
            availableStocks: b.availableStocks,
            soldStocks: b.soldStocks,
            models: b.models,
            locations: b.locations,
        })),
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalBatches.length,
            pages: Math.ceil(totalBatches.length / Number(limit)),
        },
    });
});
// Get stocks by batch (files in folder)
exports.getStocksByBatch = (0, express_async_handler_1.default)(async (req, res) => {
    const { batchId } = req.params;
    const { page = 1, limit = 50, status } = req.query;
    const query = { csvImportBatch: batchId };
    if (status)
        query["stockStatus.status"] = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [stocks, total] = await Promise.all([
        StockConceptCSV_1.StockConceptCSVModel.find(query)
            .populate("stockStatus.branchId", "branchName")
            .populate("salesInfo.soldTo", "fullName phoneNumber")
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: 1 }),
        StockConceptCSV_1.StockConceptCSVModel.countDocuments(query),
    ]);
    if (stocks.length === 0) {
        res.status(404);
        throw new Error("Batch not found");
    }
    res.json({
        success: true,
        batchId,
        data: stocks,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
});
// Update stock status
exports.updateCSVStockStatus = (0, express_async_handler_1.default)(async (req, res) => {
    const { stockId } = req.params;
    const { status, location } = req.body;
    const validStatuses = ["Available", "Sold", "Reserved", "Service"];
    if (status && !validStatuses.includes(status)) {
        res.status(400);
        throw new Error("Invalid status");
    }
    const stock = await StockConceptCSV_1.StockConceptCSVModel.findOne({ stockId });
    if (!stock) {
        res.status(404);
        throw new Error("Stock not found");
    }
    if (status)
        stock.stockStatus.status = status;
    if (location)
        stock.stockStatus.location = location.toUpperCase();
    stock.stockStatus.updatedBy = req.user._id;
    await stock.save();
    res.json({
        success: true,
        message: "Status updated",
        data: stock,
    });
});
// Soft delete CSV stock
exports.deleteCSVStock = (0, express_async_handler_1.default)(async (req, res) => {
    const { stockId } = req.params;
    const stock = await StockConceptCSV_1.StockConceptCSVModel.findOne({ stockId });
    if (!stock) {
        res.status(404);
        throw new Error("Stock not found");
    }
    if (stock.stockStatus.status === "Sold") {
        res.status(400);
        throw new Error("Cannot delete sold stock");
    }
    stock.isActive = false;
    await stock.save();
    res.json({
        success: true,
        message: "Stock deleted",
    });
});
// Unassign (reverse assignment)
exports.unassignCSVStock = (0, express_async_handler_1.default)(async (req, res) => {
    var _a;
    const { stockId } = req.params;
    const { reason } = req.body;
    const stock = await StockConceptCSV_1.StockConceptCSVModel.findOne({ stockId });
    if (!stock) {
        res.status(404);
        throw new Error("Stock not found");
    }
    if (stock.stockStatus.status !== "Sold") {
        res.status(400);
        throw new Error("Stock not assigned");
    }
    const customerVehicleId = (_a = stock.salesInfo) === null || _a === void 0 ? void 0 : _a.customerVehicleId;
    // Delete customer vehicle record
    if (customerVehicleId) {
        await CustomerVehicleModel_1.CustomerVehicleModel.findByIdAndDelete(customerVehicleId);
    }
    // Reset stock
    stock.stockStatus.status = "Available";
    stock.salesInfo = undefined;
    await stock.save();
    res.json({
        success: true,
        message: "Stock unassigned",
        data: stock,
        reason,
    });
});
