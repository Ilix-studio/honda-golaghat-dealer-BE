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
exports.CustomerVehicleModel = void 0;
// Updated CustomerVehicle Model - Complete Code with BikeImage Integration
const mongoose_1 = __importStar(require("mongoose"));
const customerVehicleSchema = new mongoose_1.Schema({
    // Core references
    stockConcept: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "StockConcept",
        required: [true, "Stock concept reference is required"],
        index: true,
    },
    customer: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "BaseCustomer",
        required: [true, "Customer reference is required"],
        unique: true,
    },
    // Ownership essentials
    registrationDate: {
        type: Date,
        validate: {
            validator: function (date) {
                return !date || date <= new Date();
            },
            message: "Registration date cannot be in future",
        },
    },
    purchaseDate: {
        type: Date,
        validate: {
            validator: function (date) {
                return !date || date <= new Date();
            },
            message: "Purchase date cannot be in future",
        },
    },
    numberPlate: {
        type: String,
        sparse: true,
        trim: true,
        unique: true,
        uppercase: true,
        match: [
            /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/,
            "Invalid number plate format",
        ],
    },
    registeredOwnerName: {
        type: String,
        trim: true,
        maxlength: [100, "Owner name cannot exceed 100 characters"],
    },
    // Payment status
    isPaid: {
        type: Boolean,
        default: false,
    },
    isFinance: {
        type: Boolean,
        default: false,
    },
    insurance: {
        type: Boolean,
        required: [true, "Insurance status is required"],
        default: false,
    },
    // RTO Information
    rtoInfo: {
        rtoCode: {
            type: String,
            uppercase: true,
            match: [/^[A-Z]{2}[0-9]{2}$/, "Invalid RTO code format (e.g., MH01)"],
        },
        rtoName: {
            type: String,
            trim: true,
        },
        rtoAddress: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
            uppercase: true,
        },
    },
    // Simplified service tracking
    serviceStatus: {
        lastServiceDate: Date,
        nextServiceDue: Date,
        kilometers: {
            type: Number,
            min: [0, "Kilometers cannot be negative"],
            default: 0,
        },
        serviceHistory: {
            type: Number,
            default: 0,
            min: [0, "Service history cannot be negative"],
        },
    },
    // Simplified VAS
    activeValueAddedServices: [
        {
            serviceId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "ValueAddedService",
                required: [true, "Service ID is required"],
            },
            activatedDate: {
                type: Date,
                required: [true, "Activation date is required"],
                default: Date.now,
            },
            expiryDate: {
                type: Date,
                required: [true, "Expiry date is required"],
            },
            purchasePrice: {
                type: Number,
                required: [true, "Purchase price is required"],
                min: [0, "Price cannot be negative"],
            },
            coverageYears: {
                type: Number,
                required: [true, "Coverage years is required"],
                min: [1, "Minimum 1 year coverage"],
            },
            isActive: {
                type: Boolean,
                default: true,
            },
        },
    ],
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Indexes
customerVehicleSchema.index({ "activeValueAddedServices.serviceId": 1 });
customerVehicleSchema.index({ "serviceStatus.nextServiceDue": 1 });
// Virtual to get vehicle details from StockConcept
customerVehicleSchema.virtual("vehicleDetails", {
    ref: "StockConcept",
    localField: "stockConcept",
    foreignField: "_id",
    justOne: true,
});
// Virtual to get bike images from BikeImage system
customerVehicleSchema.virtual("motorcycleImages", {
    ref: "BikeImage",
    localField: "stockConcept", // Use stockConcept._id to match bikeId in BikeImage
    foreignField: "bikeId",
    options: { sort: { isPrimary: -1, createdAt: -1 } }, // Primary image first
});
// Virtual to get primary motorcycle image
customerVehicleSchema.virtual("primaryMotorcycleImage", {
    ref: "BikeImage",
    localField: "stockConcept",
    foreignField: "bikeId",
    justOne: true,
    options: {
        match: { isPrimary: true },
        sort: { createdAt: -1 },
    },
});
// Ensure virtual fields are serialized
customerVehicleSchema.set("toJSON", { virtuals: true });
customerVehicleSchema.set("toObject", { virtuals: true });
exports.CustomerVehicleModel = mongoose_1.default.model("CustomerVehicle", customerVehicleSchema);
