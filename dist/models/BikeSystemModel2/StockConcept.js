"use strict";
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
exports.StockConceptModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const stockConceptSchema = new mongoose_1.Schema({
    stockId: { type: String, required: true, unique: true },
    modelName: { type: String, required: true },
    category: { type: String, required: true, enum: ["Bike", "Scooty"] },
    engineCC: { type: Number, required: true },
    color: { type: String, required: true },
    variant: { type: String, required: true },
    yearOfManufacture: {
        type: Number,
        required: true,
        min: 2000,
        max: new Date().getFullYear() + 1,
    },
    engineNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    chassisNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    stockStatus: {
        status: {
            type: String,
            enum: [
                "Available",
                "Sold",
                "Reserved",
                "Service",
                "Damaged",
                "Transit",
            ],
            default: "Available",
            required: true,
        },
        location: {
            type: String,
            enum: ["Showroom", "Warehouse", "Service Center", "Customer"],
            default: "Warehouse",
            required: true,
        },
        branchId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Branch", required: true },
        lastUpdated: { type: Date, default: Date.now },
        updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    },
    salesInfo: {
        soldTo: { type: mongoose_1.Schema.Types.ObjectId, ref: "BaseCustomer" },
        soldDate: Date,
        salePrice: Number,
        salesPerson: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
        invoiceNumber: String,
        paymentStatus: { type: String, enum: ["Paid", "Partial", "Pending"] },
        customerVehicleId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "CustomerVehicle",
        },
    },
    salesHistory: [
        {
            soldTo: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "BaseCustomer",
                required: true,
            },
            soldDate: { type: Date, required: true },
            salePrice: { type: Number, required: true },
            salesPerson: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            invoiceNumber: { type: String, required: true },
            paymentStatus: {
                type: String,
                enum: ["Paid", "Partial", "Pending"],
                required: true,
            },
            customerVehicleId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "CustomerVehicle",
                required: true,
            },
            transferType: {
                type: String,
                enum: ["New Sale", "Ownership Transfer", "Resale"],
                default: "New Sale",
            },
        },
    ],
    priceInfo: {
        exShowroomPrice: { type: Number, required: true, min: 0 },
        roadTax: { type: Number, required: true, min: 0 },
        onRoadPrice: { type: Number, required: true, min: 0 },
    },
    uniqueBookRecord: { type: String, trim: true, sparse: true },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes
stockConceptSchema.index({ "salesInfo.soldTo": 1 });
stockConceptSchema.index({ "stockStatus.status": 1 });
stockConceptSchema.index({ "salesHistory.soldTo": 1 });
exports.StockConceptModel = mongoose_1.default.model("StockConcept", stockConceptSchema);
//https://claude.ai/chat/5e0a0653-5991-4de1-b9e4-376306f8fc84
