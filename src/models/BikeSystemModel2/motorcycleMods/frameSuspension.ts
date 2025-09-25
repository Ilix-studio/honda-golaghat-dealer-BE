import { Schema } from "mongoose";
import { IFrameSuspension } from "../../types/motorcycle.types";

export const frameSuspensionSchema = new Schema<IFrameSuspension>({
  frameType: {
    type: String,
    required: [true, "Frame type is required"],
    trim: true,
  },
  frontSuspension: {
    type: String,
    required: [true, "Front suspension is required"],
    trim: true,
  },
  rearSuspension: {
    type: String,
    required: [true, "Rear suspension is required"],
    trim: true,
  },
  frontSuspensionTravel: {
    type: Number,
    required: [true, "Front suspension travel is required"],
    min: [50, "Front suspension travel must be at least 50mm"],
  },
  rearSuspensionTravel: {
    type: Number,
    required: [true, "Rear suspension travel is required"],
    min: [50, "Rear suspension travel must be at least 50mm"],
  },
});
