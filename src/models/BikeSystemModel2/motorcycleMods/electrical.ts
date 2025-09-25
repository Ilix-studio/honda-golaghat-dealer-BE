import { Schema } from "mongoose";
import { IElectricals } from "../../types/motorcycle.types";

export const electricalsSchema = new Schema<IElectricals>({
  battery: {
    type: String,
    required: [true, "Battery specification is required"],
    trim: true,
  },
  headlight: {
    type: String,
    required: [true, "Headlight type is required"],
    trim: true,
  },
  taillight: {
    type: String,
    required: [true, "Taillight type is required"],
    trim: true,
  },
  indicators: {
    type: String,
    required: [true, "Indicator type is required"],
    trim: true,
  },
  electricStart: {
    type: Boolean,
    default: true,
  },
  kickStart: {
    type: Boolean,
    default: false,
  },
  alternator: {
    type: String,
    required: [true, "Alternator specification is required"],
    trim: true,
  },
});
