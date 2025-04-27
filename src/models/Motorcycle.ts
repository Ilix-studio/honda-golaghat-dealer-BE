import mongoose, { Document, Schema } from "mongoose";

// Create interface that extends Document but without the conflicting property names
export interface IMotorcycleDocument extends Document {
  modelName: string; // Renamed from 'model' to avoid conflict
  category: "sport" | "adventure" | "cruiser" | "touring" | "naked" | "scooter";
  year: number;
  price: number;
  engine: string;
  power: string;
  transmission: string;
  features: string[];
  colors: string[];
  images: string[];
  inStock: boolean;
  quantity: number;
  branch: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MotorcycleSchema = new Schema<IMotorcycleDocument>(
  {
    modelName: {
      // Renamed from 'model' to 'modelName'
      type: String,
      required: [true, "Please add motorcycle model"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Please add motorcycle category"],
      enum: ["sport", "adventure", "cruiser", "touring", "naked", "scooter"],
    },
    year: {
      type: Number,
      required: [true, "Please add manufacturing year"],
    },
    price: {
      type: Number,
      required: [true, "Please add price"],
    },
    engine: {
      type: String,
      required: [true, "Please add engine details"],
    },
    power: {
      type: String,
      required: [true, "Please add power specifications"],
    },
    transmission: {
      type: String,
      required: [true, "Please add transmission details"],
    },
    features: [String],
    colors: [String],
    images: [String],
    inStock: {
      type: Boolean,
      default: true,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Please add a branch"],
    },
  },
  {
    timestamps: true,
  }
);

const Motorcycle = mongoose.model<IMotorcycleDocument>(
  "Motorcycle",
  MotorcycleSchema
);

export default Motorcycle;
