import mongoose, { Schema } from "mongoose";

import { bodyDimensionsSchema } from "./bodyDimension";
import { electricalsSchema } from "./electrical";
import { engineSchema } from "./engine";
import { frameSuspensionSchema } from "./frameSuspension";
import { transmissionSchema } from "./transmission";
import { tyresBrakesSchema } from "./tyresBrakes";
import {
  IFrameSuspension,
  IBodyDimensions,
  IElectricals,
  IEngine,
  ITransmission,
  ITyresBrakes,
} from "../../../types/motorcycle.types";

// Main Motorcycle Info Interface
export interface IVehicleInfo extends Document {
  _id: string;
  model: string;
  variant?: string;
  year: number;
  category: "Bike" | "Scooty";
  fuelType: "Petrol" | "Electric" | "Hybrid";
  fuelNorms: "BSIV" | "BSVI";

  // Specifications
  bodyDimensions: IBodyDimensions;
  engine: IEngine;
  transmission: ITransmission;
  tyresBrakes: ITyresBrakes;
  frameSuspension: IFrameSuspension;
  electricals: IElectricals;

  // Additional Info
  colors: string[];
  features: string[];
  mileage: string; // e.g., "47 kmpl"
  topSpeed: number; // in kmph
  priceRange: {
    min: number;
    max: number;
  };

  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Main Schema
const vehicleInfoSchema = new Schema<IVehicleInfo>(
  {
    model: {
      type: String,
      required: [true, "Model is required"],
      trim: true,
    },
    variant: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [2000, "Year must be 2000 or later"],
      max: [
        new Date().getFullYear() + 2,
        "Year cannot be more than 2 years in future",
      ],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Scooter", "Motorcycle", "Sport", "Cruiser", "Commuter"],
    },
    fuelType: {
      type: String,
      required: [true, "Fuel type is required"],
      enum: ["Petrol", "Electric", "Hybrid"],
      default: "Petrol",
    },

    // Embedded specifications
    bodyDimensions: {
      type: bodyDimensionsSchema,
      required: [true, "Body dimensions are required"],
    },
    engine: {
      type: engineSchema,
      required: [true, "Engine specifications are required"],
    },
    transmission: {
      type: transmissionSchema,
      required: [true, "Transmission specifications are required"],
    },
    tyresBrakes: {
      type: tyresBrakesSchema,
      required: [true, "Tyres and brakes specifications are required"],
    },
    frameSuspension: {
      type: frameSuspensionSchema,
      required: [true, "Frame and suspension specifications are required"],
    },
    electricals: {
      type: electricalsSchema,
      required: [true, "Electrical specifications are required"],
    },

    // Additional information
    colors: [
      {
        type: String,
        trim: true,
      },
    ],
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    mileage: {
      type: String,
      required: [true, "Mileage is required"],
      trim: true,
    },
    topSpeed: {
      type: Number,
      required: [true, "Top speed is required"],
      min: [40, "Top speed must be at least 40 kmph"],
    },
    priceRange: {
      min: {
        type: Number,
        required: [true, "Minimum price is required"],
        min: [10000, "Minimum price must be at least ₹10,000"],
      },
      max: {
        type: Number,
        required: [true, "Maximum price is required"],
        min: [10000, "Maximum price must be at least ₹10,000"],
      },
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

// Indexes for better query performance
vehicleInfoSchema.index({ model: 1, year: 1 });
vehicleInfoSchema.index({ category: 1 });
vehicleInfoSchema.index({ fuelType: 1 });
vehicleInfoSchema.index({ isActive: 1 });
vehicleInfoSchema.index({ "priceRange.min": 1, "priceRange.max": 1 });

// Compound index for model lookup
vehicleInfoSchema.index({ model: 1 }, { unique: true });

// Pre-save validation
vehicleInfoSchema.pre("save", function (next) {
  // Ensure max price is greater than min price
  if (this.priceRange.max <= this.priceRange.min) {
    return next(new Error("Maximum price must be greater than minimum price"));
  }
  next();
});

const VehicleInfo = mongoose.model<IVehicleInfo>(
  "vehicleInfo",
  vehicleInfoSchema
);

export default VehicleInfo;
