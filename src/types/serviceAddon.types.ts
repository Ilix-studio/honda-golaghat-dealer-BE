import mongoose, { Document } from "mongoose";

// Service Package Interface
export interface IServicePackage {
  name: string;
  kilometers: number;
  months: number;
  isFree: boolean;
  cost: number; // in INR
  items: string[];
  laborCharges: number;
  partsReplaced: string[];
  estimatedTime: number; // in minutes
}

// Service Addon Interface
export interface IServiceAddon extends Document {
  _id: string;
  modelName: mongoose.Types.ObjectId;

  // Free Services (Usually first 3 services)
  firstService: IServicePackage;
  secondService: IServicePackage;
  thirdService: IServicePackage;

  // Paid Services
  paidServiceOne: IServicePackage; // 4th service
  paidServiceTwo: IServicePackage; // 5th service
  paidServiceThree: IServicePackage; // 6th service
  paidServiceFour: IServicePackage; // 7th service
  paidServiceFive: IServicePackage; // 8th service

  // Additional Services
  additionalServices: IServicePackage[];

  // General Info
  validFrom: Date;
  validUntil: Date;
  applicableBranches: mongoose.Types.ObjectId[];

  // Status
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
