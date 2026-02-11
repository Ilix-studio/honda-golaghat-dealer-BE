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
const mongoose_1 = __importStar(require("mongoose"));
const BikeVariantSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Variant name is required"],
        trim: true,
    },
    features: [String],
    priceAdjustment: {
        type: Number,
        default: 0,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
});
const PriceBreakdownSchema = new mongoose_1.Schema({
    exShowroomPrice: {
        type: Number,
        required: [true, "Ex-showroom price is required"],
        min: [0, "Ex-showroom price must be positive"],
    },
    rtoCharges: {
        type: Number,
        required: [true, "RTO charges are required"],
        min: [0, "RTO charges must be positive"],
    },
    insuranceComprehensive: {
        type: Number,
        required: [true, "Insurance amount is required"],
        min: [0, "Insurance amount must be positive"],
    },
    onRoadPrice: {
        type: Number,
    },
});
const BikesSchema = new mongoose_1.Schema({
    modelName: {
        type: String,
        required: [true, "Please add vehicle model name"],
        trim: true,
        maxlength: [100, "Model name cannot exceed 100 characters"],
    },
    mainCategory: {
        type: String,
        required: [true, "Please specify main category"],
        enum: {
            values: ["bike", "scooter"],
            message: "Main category must be either bike or scooter",
        },
    },
    category: {
        type: String,
        required: [true, "Please add vehicle category"],
        enum: {
            values: [
                "sport",
                "adventure",
                "cruiser",
                "touring",
                "naked",
                "electric",
                "commuter",
                "automatic",
                "gearless",
            ],
            message: "Invalid category selected",
        },
    },
    year: {
        type: Number,
        required: [true, "Please add manufacturing year"],
        min: [2000, "Year must be 2000 or later"],
        max: [
            new Date().getFullYear() + 2,
            "Year cannot be more than 2 years in future",
        ],
    },
    variants: {
        type: [BikeVariantSchema],
        validate: {
            validator: function (variants) {
                return variants && variants.length > 0;
            },
            message: "At least one variant is required",
        },
    },
    priceBreakdown: {
        type: PriceBreakdownSchema,
        required: [true, "Price breakdown is required"],
    },
    engineSize: {
        type: String,
        required: [true, "Please add engine details"],
        trim: true,
    },
    power: {
        type: Number,
        required: [true, "Please add power specifications"],
        min: [1, "Power must be positive"],
    },
    transmission: {
        type: String,
        required: [true, "Please add transmission details"],
        trim: true,
    },
    fuelNorms: {
        type: String,
        required: [true, "Please specify fuel norms"],
        enum: {
            values: ["BS4", "BS6", "BS6 Phase 2", "Electric"],
            message: "Invalid fuel norm. Must be BS4, BS6, BS6 Phase 2, or Electric",
        },
    },
    isE20Efficiency: {
        type: Boolean,
        default: false,
        required: [true, "Please specify E20 efficiency compatibility"],
    },
    features: {
        type: [String],
        default: [],
    },
    colors: {
        type: [String],
        validate: {
            validator: function (colors) {
                return colors && colors.length > 0;
            },
            message: "At least one color option is required",
        },
    },
    stockAvailable: {
        type: Number,
        default: 0,
        min: [0, "Stock cannot be negative"],
    },
    isNewModel: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    keySpecifications: {
        engine: String,
        power: String,
        transmission: String,
        year: Number,
        fuelNorms: String,
        isE20Efficiency: Boolean,
    },
}, {
    timestamps: true,
});
// Pre-save middleware to calculate on-road price
BikesSchema.pre("save", function (next) {
    if (this.priceBreakdown) {
        this.priceBreakdown.onRoadPrice =
            this.priceBreakdown.exShowroomPrice +
                this.priceBreakdown.rtoCharges +
                this.priceBreakdown.insuranceComprehensive;
    }
    // Auto-populate key specifications
    this.keySpecifications = {
        engine: this.engineSize,
        power: `${this.power} HP`,
        transmission: this.transmission,
        year: this.year,
        fuelNorms: this.fuelNorms,
        isE20Efficiency: this.isE20Efficiency,
    };
    next();
});
// Create compound unique index
BikesSchema.index({ modelName: 1, year: 1 }, { unique: true });
// Additional performance indexes
BikesSchema.index({ mainCategory: 1 });
BikesSchema.index({ category: 1 });
BikesSchema.index({ year: -1 });
BikesSchema.index({ isActive: 1 });
BikesSchema.index({ fuelNorms: 1 });
BikesSchema.index({ isE20Efficiency: 1 });
BikesSchema.index({ "priceBreakdown.onRoadPrice": 1 });
const BikeModel = mongoose_1.default.model("Bikes", BikesSchema);
exports.default = BikeModel;
