import mongoose, { Schema } from "mongoose";
import { IServiceAddon, IServicePackage } from "../../types/serviceAddon.types";

// Service Package Schema
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

// Main Schema
const serviceAddonsSchema = new Schema<IServiceAddon>(
  {
    motorcycleModel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MotorcycleInfo",
      required: [true, "Motorcycle model is required"],
    },

    // Free Services
    firstService: {
      type: servicePackageSchema,
      required: [true, "First service details required"],
    },
    secondService: {
      type: servicePackageSchema,
      required: [true, "Second service details required"],
    },
    thirdService: {
      type: servicePackageSchema,
      required: [true, "Third service details required"],
    },

    // Paid Services
    paidServiceOne: {
      type: servicePackageSchema,
      required: [true, "Paid service one details required"],
    },
    paidServiceTwo: {
      type: servicePackageSchema,
      required: [true, "Paid service two details required"],
    },
    paidServiceThree: {
      type: servicePackageSchema,
    },
    paidServiceFour: {
      type: servicePackageSchema,
    },
    paidServiceFive: {
      type: servicePackageSchema,
    },

    // Additional services
    additionalServices: [servicePackageSchema],

    validFrom: {
      type: Date,
      required: [true, "Valid from date required"],
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: [true, "Valid until date required"],
    },
    applicableBranches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
      },
    ],

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
serviceAddonsSchema.index({ motorcycleModel: 1 });
serviceAddonsSchema.index({ isActive: 1 });
serviceAddonsSchema.index({ validFrom: 1, validUntil: 1 });

// Pre-save validation
serviceAddonsSchema.pre("save", function (next) {
  // Ensure first 3 services are free
  this.firstService.isFree = true;
  this.firstService.cost = 0;
  this.secondService.isFree = true;
  this.secondService.cost = 0;
  this.thirdService.isFree = true;
  this.thirdService.cost = 0;

  // Ensure paid services are not free
  this.paidServiceOne.isFree = false;
  this.paidServiceTwo.isFree = false;
  if (this.paidServiceThree) this.paidServiceThree.isFree = false;
  if (this.paidServiceFour) this.paidServiceFour.isFree = false;
  if (this.paidServiceFive) this.paidServiceFive.isFree = false;

  next();
});

const ServiceAddons = mongoose.model<IServiceAddon>(
  "ServiceAddons",
  serviceAddonsSchema
);

export default ServiceAddons;
