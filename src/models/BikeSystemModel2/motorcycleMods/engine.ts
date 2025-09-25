import { Schema } from "mongoose";
import { IEngine } from "../../types/motorcycle.types";

export const engineSchema = new Schema<IEngine>({
  type: {
    type: String,
    required: [true, "Engine type is required"],
    trim: true,
  },
  displacement: {
    type: Number,
    required: [true, "Engine displacement is required"],
    min: [50, "Displacement must be at least 50cc"],
  },
  maxPower: {
    type: String,
    required: [true, "Max power is required"],
    trim: true,
  },
  maxTorque: {
    type: String,
    required: [true, "Max torque is required"],
    trim: true,
  },
  compressionRatio: {
    type: String,
    required: [true, "Compression ratio is required"],
    trim: true,
  },
  valvesPerCylinder: {
    type: Number,
    required: [true, "Valves per cylinder is required"],
    min: [2, "Must have at least 2 valves per cylinder"],
  },
  cooling: {
    type: String,
    required: [true, "Cooling type is required"],
    enum: ["Air Cooled", "Liquid Cooled", "Oil Cooled"],
  },
  fuelSystem: {
    type: String,
    required: [true, "Fuel system is required"],
    trim: true,
  },
  ignition: {
    type: String,
    required: [true, "Ignition type is required"],
    trim: true,
  },
});
