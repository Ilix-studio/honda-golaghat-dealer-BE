"use strict";
// models/BikeSystemModel2/StockConceptCSV.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockConceptCSVModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const stockConceptCSVSchema = new mongoose_1.Schema({
    stockId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    // Core required fields
    modelName: { type: String, required: true },
    engineNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        index: true,
    },
    chassisNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        index: true,
    },
    color: { type: String, required: true },
    // CSV tracking
    csvImportBatch: {
        type: String,
        required: true,
        index: true,
    },
    csvImportDate: { type: Date, required: true },
    csvFileName: { type: String, required: true },
    // DYNAMIC: Stores all CSV columns as key-value pairs
    csvData: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
        default: {},
    },
    schemaVersion: { type: Number, default: 1 },
    detectedColumns: [{ type: String }],
    stockStatus: {
        status: {
            type: String,
            enum: ["Available", "Sold", "Reserved", "Service"],
            default: "Available",
            required: true,
            index: true,
        },
        location: {
            type: String,
            required: true,
            uppercase: true,
        },
        branchId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Branch",
            required: true,
        },
        updatedBy: {
            type: mongoose_1.Schema.Types.ObjectId,
            required: true,
        },
    },
    salesInfo: {
        soldTo: { type: mongoose_1.Schema.Types.ObjectId, ref: "BaseCustomer" },
        soldDate: Date,
        salePrice: Number,
        invoiceNumber: String,
        paymentStatus: {
            type: String,
            enum: ["Paid", "Partial", "Pending"],
        },
        customerVehicleId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "CustomerVehicle",
        },
    },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
    strict: false, // Allow dynamic fields
});
// Indexes
stockConceptCSVSchema.index({ "stockStatus.status": 1, csvImportBatch: 1 });
stockConceptCSVSchema.index({ "salesInfo.soldTo": 1 });
exports.StockConceptCSVModel = mongoose_1.default.model("StockConceptCSV", stockConceptCSVSchema);
