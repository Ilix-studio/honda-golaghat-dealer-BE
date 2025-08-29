import mongoose, { Schema } from "mongoose";
import {
  IMCBasicInfo,
  IRTOInfo,
  IServiceStatus,
} from "../../types/customerDash.types";

// RTO Info Schema
const rtoInfoSchema = new Schema<IRTOInfo>({
  rtoCode: {
    type: String,
    required: [true, "RTO code is required"],
    uppercase: true,
    match: [/^[A-Z]{2}[0-9]{2}$/, "Invalid RTO code format (e.g., MH01)"],
  },
  rtoName: {
    type: String,
    required: [true, "RTO name is required"],
    trim: true,
  },
  rtoAddress: {
    type: String,
    required: [true, "RTO address is required"],
    trim: true,
  },
  state: {
    type: String,
    required: [true, "State is required"],
    trim: true,
    uppercase: true,
  },
});

// Service Status Schema
const serviceStatusSchema = new Schema<IServiceStatus>({
  lastServiceDate: {
    type: Date,
  },
  nextServiceDue: {
    type: Date,
  },
  serviceType: {
    type: String,
    required: [true, "Service type is required"],
    enum: ["Regular", "Overdue", "Due Soon", "Up to Date"],
    default: "Regular",
  },
  kilometers: {
    type: Number,
    required: [true, "Current kilometers is required"],
    min: [0, "Kilometers cannot be negative"],
    default: 0,
  },
  serviceHistory: {
    type: Number,
    default: 0,
    min: [0, "Service history cannot be negative"],
  },
});

// Main Schema
const mcBasicInfoSchema = new Schema<IMCBasicInfo>(
  {
    motorcyclemodelName: {
      type: String,
      required: [true, "Bike name is required"],
      trim: true,
      maxlength: [100, "Bike name cannot exceed 100 characters"],
    },
    engineNumber: {
      type: String,
      required: [true, "Engine number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    chassisNumber: {
      type: String,
      required: [true, "Chassis number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    numberPlate: {
      type: String,
      required: [true, "Number plate is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/,
        "Invalid number plate format",
      ],
    },

    // Owner info
    registeredOwnerName: {
      type: String,
      required: [true, "Registered owner name is required"],
      trim: true,
      maxlength: [100, "Owner name cannot exceed 100 characters"],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer reference is required"],
    },

    // Documentation
    motorcyclePhoto: {
      type: String,
      trim: true,
    },
    rtoInfo: {
      type: rtoInfoSchema,
      required: [true, "RTO information is required"],
    },
    fitnessUpTo: {
      type: Date,
      required: [true, "Fitness validity date is required"],
    },
    vehicleAge: {
      type: Number,
      required: [true, "Vehicle age is required"],
      min: [0, "Vehicle age cannot be negative"],
    },
    registrationDate: {
      type: Date,
      required: [true, "Registration date is required"],
    },

    serviceStatus: {
      type: serviceStatusSchema,
      required: [true, "Service status is required"],
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
mcBasicInfoSchema.index({ customer: 1 });
mcBasicInfoSchema.index({ engineNumber: 1 });
mcBasicInfoSchema.index({ chassisNumber: 1 });
mcBasicInfoSchema.index({ numberPlate: 1 });
mcBasicInfoSchema.index({ "rtoInfo.rtoCode": 1 });
mcBasicInfoSchema.index({ fitnessUpTo: 1 });

// Pre-save middleware to calculate vehicle age
mcBasicInfoSchema.pre("save", function (next) {
  if (this.registrationDate) {
    const currentDate = new Date();
    const registrationYear = this.registrationDate.getFullYear();
    this.vehicleAge = currentDate.getFullYear() - registrationYear;
  }
  next();
});

// Method to check if fitness is expired
mcBasicInfoSchema.methods.isFitnessExpired = function () {
  return this.fitnessUpTo < new Date();
};

// Method to get service status description
mcBasicInfoSchema.methods.getServiceStatusDescription = function () {
  const { serviceType, nextServiceDue } = this.serviceStatus;
  const now = new Date();

  if (serviceType === "Overdue") {
    return "Service is overdue. Please book immediately.";
  } else if (serviceType === "Due Soon" && nextServiceDue) {
    const daysLeft = Math.ceil(
      (nextServiceDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `Service due in ${daysLeft} days.`;
  } else if (serviceType === "Up to Date") {
    return "Vehicle is up to date with service.";
  }
  return "Regular service schedule.";
};

const CustomerDashModel = mongoose.model<IMCBasicInfo>(
  "CustomerDashModel",
  mcBasicInfoSchema
);

export default CustomerDashModel;
