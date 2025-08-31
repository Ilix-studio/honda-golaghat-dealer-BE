import mongoose from "mongoose";

// Badge Interface
export interface IBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
}

// Value Added Service Interface
export interface IValueAddedService extends Document {
  _id: string;
  serviceName: string;
  serviceType:
    | "Extended Warranty"
    | "Extended Warranty Plus"
    | "Annual Maintenance Contract"
    | "Engine Health Assurance"
    | "Roadside Assistance";
  description: string;

  // Coverage Details
  coverageYears: number;
  maxEnrollmentPeriod: number; // months
  vehicleEligibility: {
    maxEngineCapacity: number; // 250cc
    categories: string[]; // ["scooter", "motorcycle"]
  };

  // Price Structure
  priceStructure: {
    basePrice: number;
    pricePerYear: number;
    engineCapacityMultiplier?: number;
  };

  // Benefits
  benefits: string[];
  coverage: {
    partsAndLabor: boolean;
    unlimitedKilometers: boolean;
    transferable: boolean;
    panIndiaService: boolean;
  };

  // Terms
  terms: string[];
  exclusions: string[];

  // Badges for customer dashboard
  badges: IBadge[];

  // Admin fields
  isActive: boolean;
  applicableBranches: mongoose.Types.ObjectId[];
  validFrom: Date;
  validUntil: Date;

  createdAt: Date;
  updatedAt: Date;
}
// Customer Active Services Model (for tracking activated services)
export interface ICustomerActiveService {
  customer: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId;
  service: mongoose.Types.ObjectId;
  activatedBy: mongoose.Types.ObjectId; // Admin who activated
  activationDate: Date;
  expiryDate: Date;
  isActive: boolean;
  badges: string[]; // Badge IDs that are active
}
