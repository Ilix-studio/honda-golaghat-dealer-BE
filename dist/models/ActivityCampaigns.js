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
// SMS Campaign Schema
const smsCampaignSchema = new mongoose_1.Schema({
    sentAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    totalSent: {
        type: Number,
        required: true,
        min: [0, "Total sent cannot be negative"],
    },
    deliveredCount: {
        type: Number,
        default: 0,
        min: [0, "Delivered count cannot be negative"],
    },
    failedCount: {
        type: Number,
        default: 0,
        min: [0, "Failed count cannot be negative"],
    },
    cost: {
        type: Number,
        required: true,
        min: [0, "SMS cost cannot be negative"],
    },
});
// Main Activity Schema
const activitySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Activity name is required"],
        trim: true,
        maxlength: [100, "Name cannot exceed 100 characters"],
    },
    date: {
        type: Date,
        required: [true, "Activity date is required"],
    },
    message: {
        type: String,
        required: [true, "Activity message is required"],
        trim: true,
        maxlength: [500, "Message cannot exceed 500 characters"],
    },
    offers: [
        {
            type: String,
            trim: true,
            maxlength: [100, "Each offer cannot exceed 100 characters"],
        },
    ],
    // Location targeting
    district: {
        type: String,
        required: [true, "District is required"],
        trim: true,
        uppercase: true,
    },
    targetBranches: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Branch",
        },
    ],
    targetCustomers: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Customer",
        },
    ],
    // SMS details
    smsTemplate: {
        type: String,
        required: [true, "SMS template is required"],
        trim: true,
        maxlength: [160, "SMS template cannot exceed 160 characters"],
    },
    smsCampaign: {
        type: smsCampaignSchema,
    },
    // Authorization
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: [true, "Creator is required"],
        refPath: "createdByModel",
    },
    approvedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Admin",
    },
    // Status management
    status: {
        type: String,
        required: [true, "Status is required"],
        enum: ["Draft", "Scheduled", "Sent", "Completed", "Cancelled"],
        default: "Draft",
    },
    scheduledFor: {
        type: Date,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Indexes
activitySchema.index({ district: 1, status: 1 });
activitySchema.index({ date: 1 });
activitySchema.index({ createdBy: 1 });
activitySchema.index({ status: 1, scheduledFor: 1 });
// Pre-save validation
activitySchema.pre("save", function (next) {
    // Ensure scheduled activities have scheduledFor date
    if (this.status === "Scheduled" && !this.scheduledFor) {
        return next(new Error("Scheduled activities must have a scheduled date"));
    }
    // Ensure activity date is not in the past for new activities
    if (this.isNew && this.date < new Date()) {
        return next(new Error("Activity date cannot be in the past"));
    }
    next();
});
// Virtual for offer count
activitySchema.virtual("offerCount").get(function () {
    var _a;
    return ((_a = this.offers) === null || _a === void 0 ? void 0 : _a.length) || 0;
});
// Method to generate SMS content
activitySchema.methods.generateSMSContent = function () {
    let smsContent = this.smsTemplate;
    smsContent = smsContent.replace("{{name}}", this.name);
    smsContent = smsContent.replace("{{date}}", this.date.toDateString());
    smsContent = smsContent.replace("{{district}}", this.district);
    if (this.offers && this.offers.length > 0) {
        smsContent += ` Offers: ${this.offers.join(", ")}`;
    }
    return smsContent.substring(0, 160); // SMS limit
};
const ActivityModel = mongoose_1.default.model("Activity", activitySchema);
exports.default = ActivityModel;
//connect a bulk sms api
