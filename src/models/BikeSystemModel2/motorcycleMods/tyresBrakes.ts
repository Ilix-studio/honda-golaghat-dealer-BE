import { Schema } from "mongoose";
import { ITyresBrakes } from "../../types/motorcycle.types";

export const tyresBrakesSchema = new Schema<ITyresBrakes>({
  frontTyre: {
    type: String,
    required: [true, "Front tyre specification is required"],
    trim: true,
  },
  rearTyre: {
    type: String,
    required: [true, "Rear tyre specification is required"],
    trim: true,
  },
  frontBrake: {
    type: String,
    required: [true, "Front brake specification is required"],
    trim: true,
  },
  rearBrake: {
    type: String,
    required: [true, "Rear brake specification is required"],
    trim: true,
  },
  abs: {
    type: Boolean,
    default: false,
  },
  tubeless: {
    type: Boolean,
    default: false,
  },
});
