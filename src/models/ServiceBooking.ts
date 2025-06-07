import mongoose, { Document, Schema } from "mongoose";

// Define the interface for a service booking
export interface IServiceBooking extends Document {
  // Vehicle Information
  bikeModel: string;
  year: number;
  vin?: string;
  mileage: number;
  registrationNumber?: string;

  // Service Details
  serviceType: string;
  additionalServices: string[];

  // Schedule Information
  serviceLocation: mongoose.Types.ObjectId;
  appointmentDate: Date;
  appointmentTime: string;

  // Customer Information
  customerName: {
    firstName: string;
    lastName: string;
  };
  contactInfo: {
    email: string;
    phone: string;
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

// Sub-schema for customer name
const CustomerNameSchema = new Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
    maxlength: [50, "First name cannot exceed 50 characters"],
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
    maxlength: [50, "Last name cannot exceed 50 characters"],
  },
});

// Sub-schema for contact information
const ContactInfoSchema = new Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    match: [
      /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
      "Please provide a valid email address",
    ],
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, "Please provide a valid phone number"],
  },
});

// Sub-schema for service options
const ServiceOptionsSchema = new Schema({
  isDropOff: {
    type: Boolean,
    default: false,
  },
  willWaitOnsite: {
    type: Boolean,
    default: false,
  },
});

// Main ServiceBooking schema
const ServiceBookingSchema = new Schema<IServiceBooking>(
  {
    // Vehicle Information
    bikeModel: {
      type: String,
      required: [true, "Bike model is required"],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [1990, "Year must be 1990 or later"],
      max: [new Date().getFullYear() + 1, "Year cannot be in the future"],
    },
    vin: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true, // Allows multiple null values but unique non-null values
    },
    mileage: {
      type: Number,
      required: [true, "Mileage is required"],
      min: [0, "Mileage cannot be negative"],
    },
    registrationNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    // Service Details
    serviceType: {
      type: String,
      required: [true, "Service type is required"],
      enum: {
        values: [
          "regular",
          "major",
          "tires",
          "diagnostic",
          "repair",
          "warranty",
          "recall",
          "inspection",
        ],
        message: "Invalid service type",
      },
    },
    additionalServices: {
      type: [String],
      default: [],
      validate: {
        validator: function (services: string[]) {
          const validServices = [
            "wash",
            "brake",
            "chain",
            "battery",
            "suspension",
            "oil-change",
            "filter-replacement",
            "tune-up",
          ];
          return services.every((service) => validServices.includes(service));
        },
        message: "Invalid additional service selected",
      },
    },

    // Schedule Information
    serviceLocation: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Service location is required"],
    },
    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
      validate: {
        validator: function (date: Date) {
          // Appointment must be in the future
          return date > new Date();
        },
        message: "Appointment date must be in the future",
      },
    },
    appointmentTime: {
      type: String,
      required: [true, "Appointment time is required"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM)$/i,
        "Please provide valid time format (e.g., 10:30 AM)",
      ],
    },

    // Customer Information
    customerName: {
      type: CustomerNameSchema,
      required: [true, "Customer name is required"],
    },
    contactInfo: {
      type: ContactInfoSchema,
      required: [true, "Contact information is required"],
    },

    // Additional Information
    specialRequests: {
      type: String,
      trim: true,
      maxlength: [1000, "Special requests cannot exceed 1000 characters"],
    },
    serviceOptions: {
      type: ServiceOptionsSchema,
      default: () => ({}),
    },

    // System Fields
    bookingId: {
      type: String,
      required: true,
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
      trim: true,
    },

    // Staff and notes
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
      maxlength: [1000, "Internal notes cannot exceed 1000 characters"],
    },

    // Branch reference
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch is required"],
    },

    // Terms and conditions
    termsAccepted: {
      type: Boolean,
      required: [true, "Terms must be accepted"],
      validate: {
        validator: function (value: boolean) {
          return value === true;
        },
        message: "Terms and conditions must be accepted",
      },
    },
    termsAcceptedAt: {
      type: Date,
      required: [true, "Terms acceptance timestamp is required"],
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
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate booking ID before saving
ServiceBookingSchema.pre("save", async function (next) {
  if (this.isNew && !this.bookingId) {
    // Generate booking ID: SB-YYYYMMDD-XXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");

    // Find the latest booking for today to get next sequence number
    const latestBooking = await ServiceBookingModel.findOne({
      bookingId: new RegExp(`^SB-${dateStr}-`),
    }).sort({ bookingId: -1 });

    let sequence = 1;
    if (latestBooking) {
      const lastSequence = parseInt(latestBooking.bookingId.split("-")[2]);
      sequence = lastSequence + 1;
    }

    this.bookingId = `SB-${dateStr}-${sequence.toString().padStart(4, "0")}`;
  }

  // Set termsAcceptedAt if terms are accepted and timestamp not set
  if (this.termsAccepted && !this.termsAcceptedAt) {
    this.termsAcceptedAt = new Date();
  }

  next();
});

// Update status timestamps
ServiceBookingSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    const now = new Date();
    switch (this.status) {
      case "confirmed":
        if (!this.confirmedAt) this.confirmedAt = now;
        break;
      case "completed":
        if (!this.completedAt) this.completedAt = now;
        break;
    }
  }
  next();
});

// Virtual for full customer name
ServiceBookingSchema.virtual("customerFullName").get(function () {
  return `${this.customerName.firstName} ${this.customerName.lastName}`;
});

// Virtual for formatted appointment datetime
ServiceBookingSchema.virtual("appointmentDateTime").get(function () {
  const date = this.appointmentDate.toLocaleDateString();
  return `${date} at ${this.appointmentTime}`;
});

// Virtual for days until appointment
ServiceBookingSchema.virtual("daysUntilAppointment").get(function () {
  const today = new Date();
  const appointment = new Date(this.appointmentDate);
  const diffTime = appointment.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Static method to find bookings by status
ServiceBookingSchema.statics.findByStatus = function (status: string) {
  return this.find({ status }).populate("serviceLocation branch");
};

// Static method to find upcoming appointments
ServiceBookingSchema.statics.findUpcoming = function (days: number = 7) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  return this.find({
    appointmentDate: {
      $gte: today,
      $lte: futureDate,
    },
    status: { $in: ["pending", "confirmed"] },
  }).populate("serviceLocation branch");
};

// Instance method to confirm booking
ServiceBookingSchema.methods.confirmBooking = function () {
  this.status = "confirmed";
  this.confirmedAt = new Date();
  return this.save();
};

// Instance method to cancel booking
ServiceBookingSchema.methods.cancelBooking = function (reason?: string) {
  this.status = "cancelled";
  if (reason) {
    this.internalNotes = `${this.internalNotes || ""}\nCancelled: ${reason}`;
  }
  return this.save();
};

// Instance method to complete booking
ServiceBookingSchema.methods.completeBooking = function (
  actualCost?: number,
  serviceNotes?: string
) {
  this.status = "completed";
  this.completedAt = new Date();
  if (actualCost) this.actualCost = actualCost;
  if (serviceNotes) this.serviceNotes = serviceNotes;
  return this.save();
};

// Index for efficient queries
ServiceBookingSchema.index({ bookingId: 1 });
ServiceBookingSchema.index({ status: 1 });
ServiceBookingSchema.index({ appointmentDate: 1 });
ServiceBookingSchema.index({ "contactInfo.email": 1 });
ServiceBookingSchema.index({ branch: 1 });
ServiceBookingSchema.index({ serviceLocation: 1 });
ServiceBookingSchema.index({ createdAt: -1 });

// Compound indexes for common queries
ServiceBookingSchema.index({ status: 1, appointmentDate: 1 });
ServiceBookingSchema.index({ branch: 1, status: 1 });
ServiceBookingSchema.index({ serviceLocation: 1, appointmentDate: 1 });

const ServiceBookingModel = mongoose.model<IServiceBooking>(
  "ServiceBooking",
  ServiceBookingSchema
);

export default ServiceBookingModel;
