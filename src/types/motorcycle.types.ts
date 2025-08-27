import mongoose, { Document, Schema } from "mongoose";

// Body Dimensions Interface
export interface IBodyDimensions {
  length: number; // in mm
  width: number; // in mm
  height: number; // in mm
  wheelbase: number; // in mm
  groundClearance: number; // in mm
  seatHeight: number; // in mm
  kerbWeight: number; // in kg
  fuelTankCapacity: number; // in liters
}

// Engine Interface
export interface IEngine {
  type: string; // e.g., "4-Stroke, SI Engine"
  displacement: number; // in cc
  maxPower: string; // e.g., "8.58 PS @ 6500 rpm"
  maxTorque: string; // e.g., "9.30 Nm @ 5000 rpm"
  compressionRatio: string; // e.g., "9.0:1"
  valvesPerCylinder: number;
  cooling: "Air Cooled" | "Liquid Cooled" | "Oil Cooled";
  fuelSystem: string; // e.g., "PGM-FI (Fuel Injection)"
  ignition: string; // e.g., "DC-CDI"
}

// Transmission Interface
export interface ITransmission {
  type: "Manual" | "Automatic" | "CVT";
  gears: number;
  clutch: string; // e.g., "Wet Multi-plate"
  finalDrive: string; // e.g., "Chain Drive"
}

// Tyres & Brakes Interface
export interface ITyresBrakes {
  frontTyre: string; // e.g., "80/100-18 M/C 47P"
  rearTyre: string; // e.g., "100/90-18 M/C 56P"
  frontBrake: string; // e.g., "240mm Disc"
  rearBrake: string; // e.g., "130mm Drum"
  abs: boolean;
  tubeless: boolean;
}

// Frame & Suspension Interface
export interface IFrameSuspension {
  frameType: string; // e.g., "Diamond Type"
  frontSuspension: string; // e.g., "Telescopic Fork"
  rearSuspension: string; // e.g., "Pro-Link Monoshock"
  frontSuspensionTravel: number; // in mm
  rearSuspensionTravel: number; // in mm
}

// Electricals Interface
export interface IElectricals {
  battery: string; // e.g., "12V, 3Ah (MF)"
  headlight: string; // e.g., "LED"
  taillight: string; // e.g., "LED"
  indicators: string; // e.g., "LED"
  electricStart: boolean;
  kickStart: boolean;
  alternator: string; // e.g., "12V, 70W"
}
