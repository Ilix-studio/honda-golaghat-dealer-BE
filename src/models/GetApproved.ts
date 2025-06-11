import mongoose, { Document, Schema } from "mongoose";

// Define the interface for GetApproved document
export interface IGetApprovedDocument extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employmentType:
    | "salaried"
    | "self-employed"
    | "business-owner"
    | "retired"
    | "student";
  monthlyIncome: number;
  creditScoreRange: "excellent" | "good" | "fair" | "poor";
  applicationId: string; // Auto-generated unique ID
  status: "pending" | "under-review" | "pre-approved" | "approved" | "rejected";
  reviewedBy?: mongoose.Types.ObjectId; // Reference to admin who reviewed
  reviewedAt?: Date;
  reviewNotes?: string;
  preApprovalAmount?: number;
  preApprovalValidUntil?: Date;
  branch?: mongoose.Types.ObjectId; // Reference to branch
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  fullName: string;
  applicationAge: number; // Days since application

  // Instance methods
  generateApplicationId(): string;
  updateStatus(
    newStatus: string,
    reviewerId?: string,
    notes?: string
  ): Promise<IGetApprovedDocument>;
  setPreApproval(
    amount: number,
    validDays?: number
  ): Promise<IGetApprovedDocument>;
}

// Create the schema
const GetApprovedSchema = new Schema<IGetApprovedDocument>(
  {
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
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
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
    employmentType: {
      type: String,
      required: [true, "Employment type is required"],
      enum: [
        "salaried",
        "self-employed",
        "business-owner",
        "retired",
        "student",
      ],
    },
    monthlyIncome: {
      type: Number,
      required: [true, "Monthly income is required"],
      min: [0, "Monthly income cannot be negative"],
    },
    creditScoreRange: {
      type: String,
      required: [true, "Credit score range is required"],
      enum: ["excellent", "good", "fair", "poor"],
    },
    applicationId: {
      type: String,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "under-review", "pre-approved", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Review notes cannot exceed 1000 characters"],
    },
    preApprovalAmount: {
      type: Number,
      min: [0, "Pre-approval amount cannot be negative"],
    },
    preApprovalValidUntil: {
      type: Date,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
    },
    termsAccepted: {
      type: Boolean,
      required: [true, "Terms and conditions must be accepted"],
      validate: {
        validator: function (value: boolean) {
          return value === true;
        },
        message: "Terms and conditions must be accepted",
      },
    },
    privacyPolicyAccepted: {
      type: Boolean,
      required: [true, "Privacy policy must be accepted"],
      validate: {
        validator: function (value: boolean) {
          return value === true;
        },
        message: "Privacy policy must be accepted",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for full name
GetApprovedSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for application age in days
GetApprovedSchema.virtual("applicationAge").get(function () {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Generate unique application ID
GetApprovedSchema.methods.generateApplicationId = function (): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `GA-${timestamp}-${randomStr}`.toUpperCase();
};

// Update status method
GetApprovedSchema.methods.updateStatus = async function (
  newStatus: string,
  reviewerId?: string,
  notes?: string
): Promise<IGetApprovedDocument> {
  this.status = newStatus;
  if (reviewerId) {
    this.reviewedBy = reviewerId;
    this.reviewedAt = new Date();
  }
  if (notes) {
    this.reviewNotes = notes;
  }
  return await this.save();
};

// Set pre-approval method
GetApprovedSchema.methods.setPreApproval = async function (
  amount: number,
  validDays: number = 30
): Promise<IGetApprovedDocument> {
  this.preApprovalAmount = amount;
  this.preApprovalValidUntil = new Date(
    Date.now() + validDays * 24 * 60 * 60 * 1000
  );
  this.status = "pre-approved";
  return await this.save();
};

// Pre-save middleware to generate application ID
GetApprovedSchema.pre("save", function (next) {
  if (!this.applicationId) {
    this.applicationId = this.generateApplicationId();
  }
  next();
});

// Create indexes for better performance
GetApprovedSchema.index({ email: 1 });
GetApprovedSchema.index({ applicationId: 1 });
GetApprovedSchema.index({ status: 1 });
GetApprovedSchema.index({ createdAt: -1 });

// Ensure virtual fields are included in JSON output
GetApprovedSchema.set("toJSON", { virtuals: true });
GetApprovedSchema.set("toObject", { virtuals: true });

const GetApproved = mongoose.model<IGetApprovedDocument>(
  "GetApproved",
  GetApprovedSchema
);

export default GetApproved;
