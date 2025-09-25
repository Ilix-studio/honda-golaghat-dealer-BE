import { Schema } from "mongoose";
import { IBodyDimensions } from "../../types/motorcycle.types";

// Sub-schemas
export const bodyDimensionsSchema = new Schema<IBodyDimensions>({
  length: {
    type: Number,
    required: [true, "Length is required"],
    min: [1000, "Length must be at least 1000mm"],
  },
  width: {
    type: Number,
    required: [true, "Width is required"],
    min: [500, "Width must be at least 500mm"],
  },
  height: {
    type: Number,
    required: [true, "Height is required"],
    min: [500, "Height must be at least 500mm"],
  },
  wheelbase: {
    type: Number,
    required: [true, "Wheelbase is required"],
    min: [800, "Wheelbase must be at least 800mm"],
  },
  groundClearance: {
    type: Number,
    required: [true, "Ground clearance is required"],
    min: [100, "Ground clearance must be at least 100mm"],
  },
  seatHeight: {
    type: Number,
    required: [true, "Seat height is required"],
    min: [600, "Seat height must be at least 600mm"],
  },
  kerbWeight: {
    type: Number,
    required: [true, "Kerb weight is required"],
    min: [50, "Kerb weight must be at least 50kg"],
  },
  fuelTankCapacity: {
    type: Number,
    required: [true, "Fuel tank capacity is required"],
    min: [3, "Fuel tank capacity must be at least 3 liters"],
  },
});
