import mongoose, { Document, Schema, Types } from "mongoose";

// Define the interface for a service booking
export interface IServiceBooking extends Document {
  // Vehicle Information
  motorcyclemodelName: mongoose.Types.ObjectId;
  vehicleAge: Types.ObjectId;
  mileage: number;
  rtoCode: Types.ObjectId;

  // Service Details
  serviceType: string;
  additionalServices: string[];

  // Schedule Information
  branchName: mongoose.Types.ObjectId;
  appointmentDate: Date;
  appointmentTime: string;

  // Customer Information
  customerName: {
    firstName: Types.ObjectId;
    lastName: Types.ObjectId;
  };
  contactInfo: {
    email: Types.ObjectId;
    phone: Types.ObjectId;
  };

  // Additional Information
  specialRequests?: string;
  serviceOptions: {
    isDropOff: boolean;
    willWaitOnsite: boolean;
  };

  // System Fields
  bookingId: string; // Auto-generated booking reference
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  priority: "normal" | "urgent";
  estimatedCost?: number;
  actualCost?: number;
  estimatedDuration?: string;

  // Assigned staff and notes
  assignedTechnician?: string;
  serviceNotes?: string;
  internalNotes?: string;

  // Branch reference
  branch: mongoose.Types.ObjectId;

  // Approval and terms
  termsAccepted: boolean;
  termsAcceptedAt: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  completedAt?: Date;

  // Virtual fields
  customerFullName: string;
  appointmentDateTime: string;
  daysUntilAppointment: number;

  // Instance methods
  confirmBooking(): Promise<IServiceBooking>;
  cancelBooking(reason?: string): Promise<IServiceBooking>;
  completeBooking(
    actualCost?: number,
    serviceNotes?: string
  ): Promise<IServiceBooking>;
}
