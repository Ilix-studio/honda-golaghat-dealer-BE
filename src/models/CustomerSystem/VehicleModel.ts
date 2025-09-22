import mongoose, { Document, Schema } from "mongoose";

export interface ICustomerVehicle extends Document {
  _id: string;
  modelName: string;
  registrationDate?: Date;
  engineNumber: string;
  chassisNumber: string;
  fitnessUpto: number;
  insurance: boolean;
  isPaid: boolean;
  isFinance: boolean;
  uniqueBookRecord?: string;
  color?: string;
  purchaseDate?: Date;

  // Customer Reference
  customer: mongoose.Types.ObjectId;

  // Derived from existing system patterns
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

  // Service Status
  serviceStatus: {
    lastServiceDate?: Date;
    nextServiceDue?: Date;
    serviceType: "Regular" | "Overdue" | "Due Soon" | "Up to Date";
    kilometers: number;
    serviceHistory: number;
  };

  // Status
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerVehicleSchema = new Schema<ICustomerVehicle>(
  {
    // Vehicle Basic Information

    modelName: {
      type: String,
      required: [true, "Model name is required"],
      trim: true,
      maxlength: [100, "Model name cannot exceed 100 characters"],
    },
    registrationDate: {
      type: Date,
      validate: {
        validator: function (date: Date) {
          return !date || date <= new Date();
        },
        message: "Registration date cannot be in future",
      },
    },

    // Unique Identifiers
    engineNumber: {
      type: String,
      required: [true, "Engine number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9]{8,20}$/, "Invalid engine number format"],
    },
    chassisNumber: {
      type: String,
      required: [true, "Chassis number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9]{17}$/, "Chassis number must be 17 characters"],
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

    // Legal and Compliance
    fitnessUpto: {
      type: Number,
      required: [true, "Fitness validity year is required"],
      min: [new Date().getFullYear(), "Fitness cannot be expired"],
      max: [new Date().getFullYear() + 20, "Invalid fitness year"],
    },
    insurance: {
      type: Boolean,
      required: [true, "Insurance status is required"],
      default: false,
    },

    // Financial Information
    isPaid: {
      type: Boolean,
      default: false,
    },
    isFinance: {
      type: Boolean,
      default: false,
    },

    uniqueBookRecord: {
      type: String,
      trim: true,
      sparse: true,
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

    // Customer Reference
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer reference is required"],
    },

    // Owner Information
    registeredOwnerName: {
      type: String,
      trim: true,
      maxlength: [100, "Owner name cannot exceed 100 characters"],
    },

    // Documentation
    motorcyclePhoto: {
      type: String,
      trim: true,
    },

    // RTO Information
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

    // Service Status
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

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
CustomerVehicleSchema.index({ customer: 1, isActive: 1 });
CustomerVehicleSchema.index({ engineNumber: 1 }, { unique: true });
CustomerVehicleSchema.index({ chassisNumber: 1 }, { unique: true });
CustomerVehicleSchema.index({ numberPlate: 1 }, { sparse: true, unique: true });
CustomerVehicleSchema.index({ category: 1, modelName: 1 });
CustomerVehicleSchema.index({ year: 1 });
CustomerVehicleSchema.index({ fitnessUpto: 1 });
CustomerVehicleSchema.index({ "serviceStatus.serviceType": 1 });

// Pre-save validations
CustomerVehicleSchema.pre("save", function (next) {
  // Set registration date if not provided
  if (!this.registrationDate && this.purchaseDate) {
    this.registrationDate = this.purchaseDate;
  }

  // Validate payment status
  if (this.isPaid && this.isFinance) {
    return next(new Error("Vehicle cannot be both fully paid and financed"));
  }

  // Generate number plate if RTO info is provided
  if (this.rtoInfo?.rtoCode && !this.numberPlate) {
    // This would typically be generated by RTO system
    // For demo purposes, we'll leave it empty
  }

  next();
});

// Methods
CustomerVehicleSchema.methods.isServiceDue = function () {
  if (!this.serviceStatus.nextServiceDue) return false;
  return new Date() >= this.serviceStatus.nextServiceDue;
};

CustomerVehicleSchema.methods.isFitnessExpired = function () {
  return new Date().getFullYear() > this.fitnessUpto;
};

const CustomerVehicleModel = mongoose.model<ICustomerVehicle>(
  "CustomerVehicle",
  CustomerVehicleSchema
);

export default CustomerVehicleModel;
