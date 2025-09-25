import { Schema } from "mongoose";
import { ITransmission } from "../../types/motorcycle.types";

export const transmissionSchema = new Schema<ITransmission>({
  type: {
    type: String,
    required: [true, "Transmission type is required"],
    enum: ["Manual", "Automatic", "CVT"],
  },
  gears: {
    type: Number,
    required: [true, "Number of gears is required"],
    min: [1, "Must have at least 1 gear"],
  },
  clutch: {
    type: String,
    required: [true, "Clutch type is required"],
    trim: true,
  },
  finalDrive: {
    type: String,
    required: [true, "Final drive type is required"],
    trim: true,
  },
});
