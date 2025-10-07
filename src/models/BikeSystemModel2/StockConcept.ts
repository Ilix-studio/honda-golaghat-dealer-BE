import mongoose, { Schema, Document } from "mongoose";

export interface IStockConcept extends Document {
  stockId: string;
  bikeInfo: {
    bikeModelId: mongoose.Types.ObjectId;
    modelName: string;
    category: string;
    engineCC: number;
    fuelType: string;
    color: string;
    variant: string;
    yearOfManufacture: number;
  };
  uniqueBookRecord?: string;
  engineDetails: {
    engineNumber: string;
    chassisNumber: string;
    engineType: string;
    maxPower: string;
    maxTorque: string;
    displacement: number;
  };
  fitnessUpto: number;
  stockStatus: {
    status:
      | "Available"
      | "Sold"
      | "Reserved"
      | "Service"
      | "Damaged"
      | "Transit";
    location: "Showroom" | "Warehouse" | "Service Center" | "Customer";
    branchId: mongoose.Types.ObjectId;
    lastUpdated: Date;
    updatedBy: mongoose.Types.ObjectId;
  };
  salesInfo?: {
    soldTo: mongoose.Types.ObjectId; // Reference to BaseCustomer
  };
  priceInfo: {
    exShowroomPrice: number;
    roadTax: number;
    insurance: number;
    additionalCharges: number;
    onRoadPrice: number;
    discount?: number;
    finalPrice: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const stockConceptSchema = new Schema<IStockConcept>(
  {
    stockId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bikeInfo: {
      bikeModelId: {
        type: Schema.Types.ObjectId,
        ref: "BikeModel",
        required: true,
      },
      modelName: { type: String, required: true },
      category: { type: String, required: true },
      engineCC: { type: Number, required: true },
      fuelType: {
        type: String,
        required: true,
        enum: ["Petrol", "Electric", "Hybrid"],
      },
      color: { type: String, required: true },
      variant: { type: String, required: true },
      yearOfManufacture: {
        type: Number,
        required: true,
        min: 2000,
        max: new Date().getFullYear() + 1,
      },
    },
    engineDetails: {
      engineNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
        uppercase: true,
      },
      chassisNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
        uppercase: true,
      },
      engineType: { type: String, required: true },
      maxPower: String,
      maxTorque: String,
      displacement: Number,
    },

    stockStatus: {
      status: {
        type: String,
        enum: [
          "Available",
          "Sold",
          "Reserved",
          "Service",
          "Damaged",
          "Transit",
        ],
        default: "Available",
        required: true,
      },
      location: {
        type: String,
        enum: ["Showroom", "Warehouse", "Service Center", "Customer"],
        default: "Warehouse",
        required: true,
      },
      branchId: {
        type: Schema.Types.ObjectId,
        ref: "Branch",
        required: true,
      },
      lastUpdated: { type: Date, default: Date.now },
      updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    salesInfo: {
      soldTo: {
        type: Schema.Types.ObjectId,
        ref: "BaseCustomer", // Updated reference
      },
      soldDate: Date,
      salePrice: Number,
      salesPerson: { type: Schema.Types.ObjectId, ref: "User" },
      invoiceNumber: String,
      paymentStatus: {
        type: String,
        enum: ["Paid", "Partial", "Pending"],
      },
      customerVehicleId: {
        type: Schema.Types.ObjectId,
        ref: "CustomerVehicle",
      },
    },
    priceInfo: {
      exShowroomPrice: { type: Number, required: true, min: 0 },
      roadTax: { type: Number, default: 0, min: 0 },
      insurance: { type: Number, default: 0, min: 0 },
      additionalCharges: { type: Number, default: 0, min: 0 },
      onRoadPrice: { type: Number, required: true, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      finalPrice: { type: Number, required: true, min: 0 },
    },
    uniqueBookRecord: {
      type: String,
      trim: true,
      sparse: true,
    },
    fitnessUpto: {
      type: Number,
      required: [true, "Fitness validity year is required"],
      min: [new Date().getFullYear(), "Fitness cannot be expired"],
      max: [new Date().getFullYear() + 20, "Invalid fitness year"],
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
stockConceptSchema.index({ "engineDetails.engineNumber": 1 });
stockConceptSchema.index({ "engineDetails.chassisNumber": 1 });
stockConceptSchema.index({ "salesInfo.soldTo": 1 });
stockConceptSchema.index({ "stockStatus.status": 1 });

export const StockConceptModel = mongoose.model<IStockConcept>(
  "StockConcept",
  stockConceptSchema
);
