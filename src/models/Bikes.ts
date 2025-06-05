import mongoose, { Document, Schema } from "mongoose";

// Create interface that extends Document but without the conflicting property names
export interface IBikesDocument extends Document {
  modelName: string; // Renamed from 'model' to avoid conflict
  category:
    | "sport"
    | "adventure"
    | "cruiser"
    | "touring"
    | "naked"
    | "electric";
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

const BikesSchema = new Schema<IBikesDocument>(
  {
    modelName: {
      // Renamed from 'model' to 'modelName'
      type: String,
      required: [true, "Please add Bikes model"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Please add Bikes category"],
      enum: ["sport", "adventure", "cruiser", "touring", "naked", "electric"],
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
    images: [
      {
        type: String,
        required: true,
      },
    ],
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

const BikeModel = mongoose.model<IBikesDocument>("Bikes", BikesSchema);

export default BikeModel;
