// Updated CustomerVehicle Model with StockConcept reference
import mongoose, { Document, Schema } from "mongoose";

export interface ICustomerVehicle extends Document {
  _id: string;
  modelName: string;

  // Reference to StockConcept for vehicle details
  stockConcept?: mongoose.Types.ObjectId; // Reference to StockConcept

  // Vehicle ownership details
  registrationDate?: Date;
  insurance: boolean;
  isPaid: boolean;
  isFinance: boolean;
  color?: string;
  purchaseDate?: Date;
  customer: mongoose.Types.ObjectId; // Reference to BaseCustomer
  numberPlate?: string;
  registeredOwnerName?: string;
  motorcyclePhoto?: string;

  // RTO Information
  rtoInfo?: {
    rtoCode: string;
    rtoName: string;
    rtoAddress: string;
    state: string;
  };

  // Service tracking
  serviceStatus: {
    lastServiceDate?: Date;
    nextServiceDue?: Date;
    serviceType: "Regular" | "Overdue" | "Due Soon" | "Up to Date";
    kilometers: number;
    serviceHistory: number;
  };

  // Service package assignment
  servicePackage: {
    packageId: mongoose.Types.ObjectId; // Reference to ServiceAddons
    activatedDate?: Date;
    currentServiceLevel: number;
    nextServiceType: string;
    completedServices: string[];
  };

  // Value added services
  activeValueAddedServices: Array<{
    serviceId: mongoose.Types.ObjectId; // Reference to ValueAddedService
    activatedDate: Date;
    expiryDate: Date;
    activatedBy: mongoose.Types.ObjectId;
    purchasePrice: number;
    coverageYears: number;
    isActive: boolean;
    activeBadges: string[];
  }>;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerVehicleSchema = new Schema<ICustomerVehicle>(
  {
    // Reference to StockConcept for vehicle specifications
    stockConcept: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockConcept",
      index: true,
    },
    modelName: { type: String, trim: true },

    registrationDate: {
      type: Date,
      validate: {
        validator: function (date: Date) {
          return !date || date <= new Date();
        },
        message: "Registration date cannot be in future",
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

    insurance: {
      type: Boolean,
      required: [true, "Insurance status is required"],
      default: false,
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    isFinance: {
      type: Boolean,
      default: false,
    },

    color: {
      type: String,
      trim: true,
      maxlength: [50, "Color name cannot exceed 50 characters"],
    },

    purchaseDate: {
      type: Date,
      validate: {
        validator: function (date: Date) {
          return !date || date <= new Date();
        },
        message: "Purchase date cannot be in future",
      },
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseCustomer",
      required: [true, "Customer reference is required"],
    },

    registeredOwnerName: {
      type: String,
      trim: true,
      maxlength: [100, "Owner name cannot exceed 100 characters"],
    },

    motorcyclePhoto: {
      type: String,
      trim: true,
    },

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

    serviceStatus: {
      lastServiceDate: Date,
      nextServiceDue: Date,
      serviceType: {
        type: String,
        enum: ["Regular", "Overdue", "Due Soon", "Up to Date"],
        default: "Regular",
      },
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

    servicePackage: {
      packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceAddons",
        required: [true, "Service package is required"],
      },
      activatedDate: {
        type: Date,
        default: Date.now,
      },
      currentServiceLevel: {
        type: Number,
        min: [1, "Service level starts from 1"],
        max: [8, "Maximum 8 service levels"],
        default: 1,
      },
      nextServiceType: {
        type: String,
        enum: [
          "firstService",
          "secondService",
          "thirdService",
          "paidServiceOne",
          "paidServiceTwo",
          "paidServiceThree",
          "paidServiceFour",
          "paidServiceFive",
        ],
        default: "firstService",
      },
      completedServices: [
        {
          type: String,
          enum: [
            "firstService",
            "secondService",
            "thirdService",
            "paidServiceOne",
            "paidServiceTwo",
            "paidServiceThree",
            "paidServiceFour",
            "paidServiceFive",
          ],
        },
      ],
    },

    activeValueAddedServices: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
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
        activatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "BaseCustomer",
          required: [true, "Activated by admin is required"],
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
        activeBadges: [
          {
            type: String,
            required: true,
          },
        ],
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
customerVehicleSchema.index({ customer: 1, isActive: 1 });
customerVehicleSchema.index({ stockConcept: 1 });
customerVehicleSchema.index({ numberPlate: 1 }, { sparse: true, unique: true });
customerVehicleSchema.index({ "servicePackage.packageId": 1 });
customerVehicleSchema.index({ "activeValueAddedServices.serviceId": 1 });

// Virtual to get vehicle details from StockConcept
customerVehicleSchema.virtual("vehicleDetails", {
  ref: "StockConcept",
  localField: "stockConcept",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtual fields are serialized
customerVehicleSchema.set("toJSON", { virtuals: true });
customerVehicleSchema.set("toObject", { virtuals: true });

export const CustomerVehicleModel = mongoose.model<ICustomerVehicle>(
  "CustomerVehicle",
  customerVehicleSchema
);
