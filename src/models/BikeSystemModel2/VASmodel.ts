import mongoose, { Schema } from "mongoose";
import { IValueAddedService } from "../../types/vas.types";

// Main Schema
const valueAddedServiceSchema = new Schema<IValueAddedService>(
  {
    serviceName: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      maxlength: [100, "Service name cannot exceed 100 characters"],
    },

    coverageYears: {
      type: Number,
      required: [true, "Coverage years is required"],
      min: [1, "Minimum 1 year coverage"],
      max: [10, "Maximum 10 years coverage"],
    },

    priceStructure: {
      basePrice: {
        type: Number,
        required: [true, "Base price is required"],
        min: [0, "Price cannot be negative"],
      },
    },

    benefits: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    applicableBranches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
      },
    ],

    validFrom: {
      type: Date,
      default: Date.now,
    },

    validUntil: {
      type: Date,
      required: [true, "Valid until date is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
valueAddedServiceSchema.index({ serviceType: 1, isActive: 1 });
valueAddedServiceSchema.index({ validFrom: 1, validUntil: 1 });
valueAddedServiceSchema.index({ "vehicleEligibility.maxEngineCapacity": 1 });
valueAddedServiceSchema.index({ coverageYears: 1 });

// Pre-save middleware to validate dates
valueAddedServiceSchema.pre("save", function (next) {
  if (this.validUntil <= this.validFrom) {
    next(new Error("Valid until date must be after valid from date"));
    return;
  }
  next();
});

// Method to calculate price for specific vehicle
valueAddedServiceSchema.methods.calculatePrice = function (
  vehicleEngineCapacity: number,
  selectedYears: number
) {
  const basePrice = this.priceStructure.basePrice;
  const yearlyPrice = this.priceStructure.pricePerYear * selectedYears;
  const capacityMultiplier =
    vehicleEngineCapacity > 125
      ? this.priceStructure.engineCapacityMultiplier || 1
      : 1;

  return Math.round((basePrice + yearlyPrice) * capacityMultiplier);
};

// Method to check vehicle eligibility
valueAddedServiceSchema.methods.isVehicleEligible = function (
  engineCapacity: number,
  category: string
) {
  return (
    engineCapacity <= this.vehicleEligibility.maxEngineCapacity &&
    this.vehicleEligibility.categories.includes(category)
  );
};

const ValueAddedServiceModel = mongoose.model<IValueAddedService>(
  "ValueAddedService",
  valueAddedServiceSchema
);

export default ValueAddedServiceModel;
