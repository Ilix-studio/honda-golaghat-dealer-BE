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
const feedbackSchema = new mongoose_1.Schema({
    customer: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Customer",
        required: [true, "Customer reference is required"],
    },
    vehicle: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "CustomerDashModel",
        required: [true, "Vehicle reference is required"],
    },
    message: {
        type: String,
        required: [true, "Feedback message is required"],
        trim: true,
        minlength: [10, "Message must be at least 10 characters long"],
        maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    photos: [
        {
            type: String, // Cloudinary URLs
            validate: {
                validator: function (photos) {
                    return photos.length <= 3;
                },
                message: "Maximum 3 photos allowed",
            },
        },
    ],
    rating: {
        type: Number,
        min: [1, "Rating must be between 1 and 5"],
        max: [5, "Rating must be between 1 and 5"],
    },
    status: {
        type: String,
        enum: ["pending", "reviewed", "resolved"],
        default: "pending",
    },
    reviewedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Admin",
    },
    reviewedAt: {
        type: Date,
    },
    adminReply: {
        type: String,
        trim: true,
        maxlength: [500, "Admin reply cannot exceed 500 characters"],
    },
}, {
    timestamps: true,
});
// Indexes for better query performance
feedbackSchema.index({ vehicle: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ rating: 1 });
// Virtual to get customer name from populated customer
feedbackSchema.virtual("customerName").get(function () {
    if (this.populated("customer")) {
        const customer = this.customer;
        return `${customer.firstName} ${customer.lastName}`;
    }
    return null;
});
// Virtual to get bike name from populated vehicle
feedbackSchema.virtual("bikeName").get(function () {
    if (this.populated("vehicle")) {
        const vehicle = this.vehicle;
        return vehicle.motorcyclemodelName;
    }
    return null;
});
// Ensure virtual fields are serialized
feedbackSchema.set("toJSON", { virtuals: true });
feedbackSchema.set("toObject", { virtuals: true });
// Pre-save middleware to set reviewedAt when status changes to reviewed
feedbackSchema.pre("save", function (next) {
    if (this.isModified("status") &&
        this.status === "reviewed" &&
        !this.reviewedAt) {
        this.reviewedAt = new Date();
    }
    next();
});
// Static method to get feedback stats
feedbackSchema.statics.getFeedbackStats = async function (vehicleId) {
    const matchQuery = vehicleId ? { vehicle: vehicleId } : {};
    return await this.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalFeedbacks: { $sum: 1 },
                averageRating: { $avg: "$rating" },
                pendingCount: {
                    $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
                },
                reviewedCount: {
                    $sum: { $cond: [{ $eq: ["$status", "reviewed"] }, 1, 0] },
                },
                resolvedCount: {
                    $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
                },
            },
        },
    ]);
};
// Instance method to check if feedback can be edited
feedbackSchema.methods.canEdit = function () {
    return this.status === "pending";
};
const FeedbackModel = mongoose_1.default.model("Feedback", feedbackSchema);
exports.default = FeedbackModel;
