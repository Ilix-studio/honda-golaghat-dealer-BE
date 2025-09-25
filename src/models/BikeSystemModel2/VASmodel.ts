import mongoose, { Schema, Document } from "mongoose";
import { IBadge, IValueAddedService } from "../../types/vas.types";

// Badge Schema
const badgeSchema = new Schema<IBadge>({
  name: {
    type: String,
    required: [true, "Badge name is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Badge description is required"],
    trim: true,
  },
  icon: {
    type: String,
    required: [true, "Badge icon is required"], // CSS class or icon name
    trim: true,
  },
  color: {
    type: String,
    required: [true, "Badge color is required"],
    match: [/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Main Schema
const valueAddedServiceSchema = new Schema<IValueAddedService>(
  {
    serviceName: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      maxlength: [100, "Service name cannot exceed 100 characters"],
    },

    serviceType: {
      type: String,
      required: [true, "Service type is required"],
      enum: {
        values: [
          "Extended Warranty",
          "Extended Warranty Plus",
          "Annual Maintenance Contract",
          "Engine Health Assurance",
          "Roadside Assistance",
        ],
        message: "Invalid service type",
      },
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    coverageYears: {
      type: Number,
      required: [true, "Coverage years is required"],
      min: [1, "Minimum 1 year coverage"],
      max: [10, "Maximum 10 years coverage"],
    },

    maxEnrollmentPeriod: {
      type: Number,
      required: [true, "Maximum enrollment period is required"],
      min: [1, "Minimum 1 month"],
      max: [108, "Maximum 9 years (108 months)"],
    },

    vehicleEligibility: {
      maxEngineCapacity: {
        type: Number,
        required: [true, "Max engine capacity is required"],
        default: 250,
      },
      categories: [
        {
          type: String,
          enum: ["scooter", "motorcycle", "commuter", "sports", "cruiser"],
          required: true,
        },
      ],
    },

    priceStructure: {
      basePrice: {
        type: Number,
        required: [true, "Base price is required"],
        min: [0, "Price cannot be negative"],
      },
      pricePerYear: {
        type: Number,
        required: [true, "Price per year is required"],
        min: [0, "Price cannot be negative"],
      },
      engineCapacityMultiplier: {
        type: Number,
        default: 1,
        min: [0.5, "Minimum multiplier is 0.5"],
      },
    },

    benefits: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],

    coverage: {
      partsAndLabor: {
        type: Boolean,
        default: true,
      },
      unlimitedKilometers: {
        type: Boolean,
        default: false,
      },
      transferable: {
        type: Boolean,
        default: false,
      },
      panIndiaService: {
        type: Boolean,
        default: true,
      },
    },

    terms: [
      {
        type: String,
        trim: true,
      },
    ],

    exclusions: [
      {
        type: String,
        trim: true,
      },
    ],

    badges: [badgeSchema],

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

// Method to get active badges
valueAddedServiceSchema.methods.getActiveBadges = function () {
  return this.badges.filter((badge: IBadge) => badge.isActive);
};

const ValueAddedServiceModel = mongoose.model<IValueAddedService>(
  "ValueAddedService",
  valueAddedServiceSchema
);

export default ValueAddedServiceModel;
