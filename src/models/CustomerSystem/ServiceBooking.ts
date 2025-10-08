import mongoose, { Schema, Document } from "mongoose";

export interface IServiceBooking extends Document {
  _id: string;

  // Vehicle Information (for public bookings)
  motorcyclemodelName?: string;
  vehicleAge?: number;
  mileage?: number;
  rtoCode?: string;

  // References (for authenticated users)
  customer?: mongoose.Types.ObjectId; // Reference to BaseCustomer
  vehicle?: mongoose.Types.ObjectId; // Reference to CustomerVehicle
  servicePackage?: mongoose.Types.ObjectId; // Reference to ServiceAddons

  // Service Details
  serviceType: string;
  additionalServices?: string[];

  // Schedule Information
  branchName: mongoose.Types.ObjectId; // Reference to Branch
  appointmentDate: Date;
  appointmentTime: string;

  // Customer Information (for public bookings)
  customerName?: {
    firstName: string;
    lastName: string;
  };
  contactInfo?: {
    email: string;
    phone: string;
  };

  // Additional Information
  specialRequests?: string;
  serviceOptions?: {
    isDropOff: boolean;
    willWaitOnsite: boolean;
  };

  // System Fields
  bookingId: string; // Auto-generated booking reference
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  priority?: "normal" | "urgent";
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
  termsAccepted?: boolean;
  termsAcceptedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  completedAt?: Date;

  // Virtual fields
  appointmentDateTime?: string;
  customerFullName?: string;
  daysUntilAppointment?: number;

  // Instance methods
  confirmBooking(): Promise<IServiceBooking>;
  cancelBooking(reason?: string): Promise<IServiceBooking>;
  completeBooking(
    actualCost?: number,
    serviceNotes?: string
  ): Promise<IServiceBooking>;
}

const serviceBookingSchema = new Schema<IServiceBooking>(
  {
    // Vehicle Information (for public bookings)
    motorcyclemodelName: {
      type: String,
      trim: true,
    },
    vehicleAge: {
      type: Number,
      min: [0, "Vehicle age cannot be negative"],
    },
    mileage: {
      type: Number,
      min: [0, "Mileage cannot be negative"],
    },
    rtoCode: {
      type: String,
      trim: true,
      uppercase: true,
    },

    // References (for authenticated users)
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseCustomer",
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerVehicle",
    },
    servicePackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceAddons",
    },

    // Service Details
    serviceType: {
      type: String,
      required: [true, "Service type is required"],
      enum: [
        "firstService",
        "secondService",
        "thirdService",
        "paidServiceOne",
        "paidServiceTwo",
        "paidServiceThree",
        "paidServiceFour",
        "paidServiceFive",
        "general-service",
        "oil-change",
        "brake-service",
        "battery-replacement",
        "tire-replacement",
        "engine-tuning",
        "chain-sprocket",
        "clutch-service",
        "carburetor-cleaning",
        "electrical-repair",
        "body-repair",
        "painting",
        "insurance-claim",
        "accident-repair",
      ],
    },
    additionalServices: [
      {
        type: String,
        trim: true,
      },
    ],

    // Schedule Information
    branchName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch is required"],
    },
    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
      validate: {
        validator: function (date: Date) {
          return date >= new Date();
        },
        message: "Appointment date cannot be in the past",
      },
    },
    appointmentTime: {
      type: String,
      required: [true, "Appointment time is required"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM)$/i,
        "Please provide valid time format",
      ],
    },

    // Customer Information (for public bookings)
    customerName: {
      firstName: {
        type: String,
        trim: true,
        maxlength: [50, "First name cannot exceed 50 characters"],
      },
      lastName: {
        type: String,
        trim: true,
        maxlength: [50, "Last name cannot exceed 50 characters"],
      },
    },
    contactInfo: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Please provide a valid email address",
        ],
      },
      phone: {
        type: String,
        trim: true,
        match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
      },
    },

    // Additional Information
    specialRequests: {
      type: String,
      trim: true,
      maxlength: [1000, "Special requests cannot exceed 1000 characters"],
    },
    serviceOptions: {
      isDropOff: {
        type: Boolean,
        default: false,
      },
      willWaitOnsite: {
        type: Boolean,
        default: false,
      },
    },

    // System Fields
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
    },
    estimatedCost: {
      type: Number,
      min: [0, "Estimated cost cannot be negative"],
    },
    actualCost: {
      type: Number,
      min: [0, "Actual cost cannot be negative"],
    },
    estimatedDuration: {
      type: String,
      match: [
        /^\d+\s?(hours?|minutes?|hrs?|mins?)$/i,
        "Invalid duration format",
      ],
    },

    // Assigned staff and notes
    assignedTechnician: {
      type: String,
      trim: true,
    },
    serviceNotes: {
      type: String,
      trim: true,
      maxlength: [2000, "Service notes cannot exceed 2000 characters"],
    },
    internalNotes: {
      type: String,
      trim: true,
      maxlength: [2000, "Internal notes cannot exceed 2000 characters"],
    },

    // Branch reference
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch is required"],
    },

    // Approval and terms
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    termsAcceptedAt: {
      type: Date,
    },

    // Additional timestamps
    confirmedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for appointment date and time combined
serviceBookingSchema.virtual("appointmentDateTime").get(function () {
  if (!this.appointmentDate || !this.appointmentTime) return "";

  const date = new Date(this.appointmentDate);
  return `${date.toDateString()} at ${this.appointmentTime}`;
});

// Virtual for customer full name
serviceBookingSchema.virtual("customerFullName").get(function () {
  if (!this.customerName?.firstName || !this.customerName?.lastName) return "";
  return `${this.customerName.firstName} ${this.customerName.lastName}`;
});

// Virtual for days until appointment
serviceBookingSchema.virtual("daysUntilAppointment").get(function () {
  if (!this.appointmentDate) return 0;

  const now = new Date();
  const appointment = new Date(this.appointmentDate);
  const diffTime = appointment.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Instance method to confirm booking
serviceBookingSchema.methods.confirmBooking = function () {
  this.status = "confirmed";
  this.confirmedAt = new Date();
  return this.save();
};

// Instance method to cancel booking
serviceBookingSchema.methods.cancelBooking = function (reason?: string) {
  this.status = "cancelled";
  if (reason) {
    this.internalNotes = this.internalNotes
      ? `${this.internalNotes}\n\nCancellation reason: ${reason}`
      : `Cancellation reason: ${reason}`;
  }
  return this.save();
};

// Instance method to complete booking
serviceBookingSchema.methods.completeBooking = function (
  actualCost?: number,
  serviceNotes?: string
) {
  this.status = "completed";
  this.completedAt = new Date();
  if (actualCost) this.actualCost = actualCost;
  if (serviceNotes) this.serviceNotes = serviceNotes;
  return this.save();
};

// Ensure virtual fields are serialized
serviceBookingSchema.set("toJSON", { virtuals: true });
serviceBookingSchema.set("toObject", { virtuals: true });

// Indexes

serviceBookingSchema.index({ vehicle: 1, status: 1 });
serviceBookingSchema.index({ appointmentDate: 1 });

serviceBookingSchema.index({
  branchName: 1,
  appointmentDate: 1,
  appointmentTime: 1,
});
serviceBookingSchema.index({ branch: 1, status: 1 });

export const ServiceBooking = mongoose.model<IServiceBooking>(
  "ServiceBooking",
  serviceBookingSchema
);
