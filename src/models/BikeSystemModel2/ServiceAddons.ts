import mongoose, { Schema } from "mongoose";

// Simplified Service Package Interface
export interface IServicePackage {
  name: string;
  kilometers: number;
  months: number;
  isFree: boolean;
  cost: number; // in INR
  items: string[];
  laborCharges: number;
  partsReplaced: string[];
  estimatedTime: number; // in minutes
}

// Simplified Service Addon Interface
export interface IServiceAddon extends Document {
  _id: string;
  serviceName: IServicePackage;
  validFrom: Date;
  validUntil: Date;
  branch: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Service Package Schema (unchanged)
const servicePackageSchema = new Schema<IServicePackage>({
  name: {
    type: String,
    required: [true, "Service name is required"],
    trim: true,
  },
  kilometers: {
    type: Number,
    required: [true, "Service kilometers is required"],
    min: [500, "Minimum 500 km"],
  },
  months: {
    type: Number,
    required: [true, "Service months is required"],
    min: [1, "Minimum 1 month"],
  },
  isFree: {
    type: Boolean,
    default: false,
  },
  cost: {
    type: Number,
    required: [true, "Service cost is required"],
    min: [0, "Cost cannot be negative"],
    default: 0,
  },
  items: [
    {
      type: String,
      required: true,
      trim: true,
    },
  ],
  laborCharges: {
    type: Number,
    required: [true, "Labor charges required"],
    min: [0, "Labor charges cannot be negative"],
    default: 0,
  },
  partsReplaced: [
    {
      type: String,
      trim: true,
    },
  ],
  estimatedTime: {
    type: Number,
    required: [true, "Estimated time is required"],
    min: [30, "Minimum 30 minutes"],
    default: 60,
  },
});

// Simplified Main Schema
const serviceAddonsSchema = new Schema<IServiceAddon>(
  {
    serviceName: {
      type: servicePackageSchema,
      required: [true, "Service details required"],
    },

    validFrom: {
      type: Date,
      required: [true, "Valid from date required"],
      default: Date.now,
    },

    validUntil: {
      type: Date,
      required: [true, "Valid until date required"],
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch is required"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
serviceAddonsSchema.index({ branch: 1 });
serviceAddonsSchema.index({ isActive: 1 });
serviceAddonsSchema.index({ validFrom: 1, validUntil: 1 });

// Date validation
serviceAddonsSchema.pre("save", function (next) {
  if (this.validUntil <= this.validFrom) {
    return next(new Error("Valid until date must be after valid from date"));
  }
  next();
});

const ServiceAddonsModel = mongoose.model<IServiceAddon>(
  "ServiceAddons",
  serviceAddonsSchema
);

export default ServiceAddonsModel;
