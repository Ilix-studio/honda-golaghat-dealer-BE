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
// Sub-schema for bike enquiry
const BikeEnquirySchema = new mongoose_1.Schema({
    bikeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Bikes",
    },
    bikeModel: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        enum: [
            "sport",
            "adventure",
            "cruiser",
            "touring",
            "naked",
            "electric",
            "commuter",
        ],
    },
    priceRange: {
        min: {
            type: Number,
            min: 0,
        },
        max: {
            type: Number,
            min: 0,
        },
    },
    preferredFeatures: [String],
    intendedUse: {
        type: String,
        enum: [
            "daily-commute",
            "long-touring",
            "sport-riding",
            "off-road",
            "leisure",
            "business",
        ],
    },
    previousBikeExperience: {
        type: String,
        enum: ["first-time", "beginner", "intermediate", "experienced"],
    },
    urgency: {
        type: String,
        enum: ["immediate", "within-month", "within-3months", "exploring"],
        default: "exploring",
    },
    additionalRequirements: {
        type: String,
        trim: true,
        maxlength: [500, "Additional requirements cannot exceed 500 characters"],
    },
    tradeInBike: {
        hasTradeIn: {
            type: Boolean,
            default: false,
        },
        currentBikeModel: String,
        currentBikeYear: Number,
        estimatedValue: Number,
        condition: {
            type: String,
            enum: ["excellent", "good", "fair", "poor"],
        },
    },
});
// Sub-schema for trade-in bike
const TradeInBikeSchema = new mongoose_1.Schema({
    hasTradeIn: {
        type: Boolean,
        default: false,
    },
    currentBikeModel: {
        type: String,
        trim: true,
    },
    currentBikeYear: {
        type: Number,
        min: 1980,
        max: new Date().getFullYear() + 1,
    },
    estimatedValue: {
        type: Number,
        min: 0,
    },
    condition: {
        type: String,
        enum: ["excellent", "good", "fair", "poor"],
    },
});
// Create the main schema
const GetApprovedSchema = new mongoose_1.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        unique: true,
        match: [
            /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
            "Please provide a valid email address",
        ],
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, "Please provide a valid phone number"],
    },
    employmentType: {
        type: String,
        required: [true, "Employment type is required"],
        enum: [
            "salaried",
            "self-employed",
            "business-owner",
            "retired",
            "student",
        ],
    },
    monthlyIncome: {
        type: Number,
        required: [true, "Monthly income is required"],
        min: [0, "Monthly income cannot be negative"],
    },
    creditScoreRange: {
        type: String,
        required: [true, "Credit score range is required"],
        enum: ["excellent", "good", "fair", "poor"],
    },
    applicationId: {
        type: String,
        unique: true,
        index: true,
    },
    status: {
        type: String,
        enum: ["pending", "under-review", "pre-approved", "approved", "rejected"],
        default: "pending",
    },
    reviewedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Admin",
    },
    reviewedAt: {
        type: Date,
    },
    reviewNotes: {
        type: String,
        trim: true,
        maxlength: [1000, "Review notes cannot exceed 1000 characters"],
    },
    preApprovalAmount: {
        type: Number,
        min: [0, "Pre-approval amount cannot be negative"],
    },
    preApprovalValidUntil: {
        type: Date,
    },
    branch: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Branch",
    },
    termsAccepted: {
        type: Boolean,
        required: [true, "Terms and conditions must be accepted"],
        validate: {
            validator: function (value) {
                return value === true;
            },
            message: "Terms and conditions must be accepted",
        },
    },
    privacyPolicyAccepted: {
        type: Boolean,
        required: [true, "Privacy policy must be accepted"],
        validate: {
            validator: function (value) {
                return value === true;
            },
            message: "Privacy policy must be accepted",
        },
    },
    // NEW: Bike enquiry information
    bikeEnquiry: {
        type: BikeEnquirySchema,
        default: null,
    },
    enquiryType: {
        type: String,
        enum: ["general-financing", "specific-bike", "trade-in", "upgrade"],
        default: "general-financing",
    },
}, {
    timestamps: true,
});
// Virtual for full name
GetApprovedSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});
// Virtual for application age in days
GetApprovedSchema.virtual("applicationAge").get(function () {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
// Generate unique application ID
GetApprovedSchema.methods.generateApplicationId = function () {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const prefix = this.enquiryType === "specific-bike" ? "GAB" : "GA"; // GAB for bike-specific enquiries
    return `${prefix}-${timestamp}-${randomStr}`.toUpperCase();
};
// Update status method
GetApprovedSchema.methods.updateStatus = async function (newStatus, reviewerId, notes) {
    this.status = newStatus;
    if (reviewerId) {
        this.reviewedBy = reviewerId;
        this.reviewedAt = new Date();
    }
    if (notes) {
        this.reviewNotes = notes;
    }
    return await this.save();
};
// Set pre-approval method
GetApprovedSchema.methods.setPreApproval = async function (amount, validDays = 30) {
    this.preApprovalAmount = amount;
    this.preApprovalValidUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);
    this.status = "pre-approved";
    return await this.save();
};
// Add bike enquiry method
GetApprovedSchema.methods.addBikeEnquiry = async function (bikeInfo) {
    var _a;
    this.bikeEnquiry = bikeInfo;
    if (bikeInfo.bikeId || bikeInfo.bikeModel) {
        this.enquiryType = "specific-bike";
    }
    if ((_a = bikeInfo.tradeInBike) === null || _a === void 0 ? void 0 : _a.hasTradeIn) {
        this.enquiryType = "trade-in";
    }
    return await this.save();
};
// Pre-save middleware to generate application ID
GetApprovedSchema.pre("save", function (next) {
    if (!this.applicationId) {
        this.applicationId = this.generateApplicationId();
    }
    next();
});
// Create indexes for better performance
GetApprovedSchema.index({ status: 1 });
GetApprovedSchema.index({ enquiryType: 1 });
GetApprovedSchema.index({ "bikeEnquiry.bikeId": 1 });
GetApprovedSchema.index({ "bikeEnquiry.category": 1 });
GetApprovedSchema.index({ createdAt: -1 });
// Ensure virtual fields are included in JSON output
GetApprovedSchema.set("toJSON", { virtuals: true });
GetApprovedSchema.set("toObject", { virtuals: true });
const GetApproved = mongoose_1.default.model("GetApproved", GetApprovedSchema);
exports.default = GetApproved;
