import mongoose, { Schema, Document } from "mongoose";

export interface ICustomerActiveService extends Document {
  _id: string;
  customer: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId;
  service: mongoose.Types.ObjectId;
  activatedBy: mongoose.Types.ObjectId; // Admin who activated
  activationDate: Date;
  expiryDate: Date;
  isActive: boolean;
  activeBadges: string[]; // Badge IDs that are active for this customer
  purchasePrice: number;
  coverageYears: number;
  createdAt: Date;
  updatedAt: Date;
}

const customerActiveServiceSchema = new Schema<ICustomerActiveService>(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerDashModel",
      required: [true, "Vehicle is required"],
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ValueAddedService",
      required: [true, "Service is required"],
    },

    activatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Activated by admin is required"],
    },

    activationDate: {
      type: Date,
      default: Date.now,
    },

    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    activeBadges: [
      {
        type: String, // Badge IDs from the service
        required: true,
      },
    ],

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
  },
  {
    timestamps: true,
  }
);

// Indexes
customerActiveServiceSchema.index({ customer: 1, isActive: 1 });
customerActiveServiceSchema.index({ vehicle: 1, isActive: 1 });
customerActiveServiceSchema.index({ expiryDate: 1 });
customerActiveServiceSchema.index({ service: 1 });

// Check if service is expired
customerActiveServiceSchema.methods.isExpired = function () {
  return this.expiryDate < new Date();
};

// Get remaining coverage time
customerActiveServiceSchema.methods.getRemainingCoverage = function () {
  const now = new Date();
  const remaining = this.expiryDate.getTime() - now.getTime();
  const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
};

const CustomerActiveServiceModel = mongoose.model<ICustomerActiveService>(
  "CustomerActiveService",
  customerActiveServiceSchema
);

export default CustomerActiveServiceModel;
