import mongoose, { Document, Schema } from "mongoose";

export interface ICustomer extends Document {
  _id: string;
  phone: string;
  firstName: string;
  middleName?: string; // Made optional since it's not always required
  lastName: string;
  email?: string;
  village: string;
  postOffice: string;
  policeStation: string;
  district: string;
  state: string;
  firebaseUid?: string; // Firebase auth UID
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number"],
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters long"],
      maxlength: [30, "First name cannot exceed 30 characters"],
    },
    middleName: {
      type: String,
      trim: true,
      maxlength: [30, "Middle name cannot exceed 30 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters long"],
      maxlength: [30, "Last name cannot exceed 30 characters"],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    village: {
      type: String,
      required: [true, "Village is required"],
      trim: true,
      maxlength: [100, "Village name cannot exceed 100 characters"],
    },
    postOffice: {
      type: String,
      required: [true, "Post office is required"],
      trim: true,
      maxlength: [100, "Post office name cannot exceed 100 characters"],
    },
    policeStation: {
      type: String,
      required: [true, "Police station is required"],
      trim: true,
      maxlength: [100, "Police station name cannot exceed 100 characters"],
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
      maxlength: [50, "District name cannot exceed 50 characters"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: [50, "State name cannot exceed 50 characters"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    firebaseUid: {
      type: String,
      sparse: true, // Allows multiple null values
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
customerSchema.index({ phone: 1 });
customerSchema.index({ isVerified: 1 });
customerSchema.index({ firebaseUid: 1 });
customerSchema.index({ district: 1, state: 1 }); // Composite index for location queries
customerSchema.index({ firstName: 1, lastName: 1 }); // For name-based searches

// Virtual for full name
customerSchema.virtual("fullName").get(function (this: ICustomer) {
  const parts = [this.firstName, this.middleName, this.lastName].filter(
    Boolean
  );
  return parts.join(" ");
});

// Virtual for full address
customerSchema.virtual("fullAddress").get(function (this: ICustomer) {
  return `${this.village}, ${this.postOffice}, ${this.policeStation}, ${this.district}, ${this.state}`;
});

// Ensure virtual fields are serialized
customerSchema.set("toJSON", { virtuals: true });
customerSchema.set("toObject", { virtuals: true });

// Pre-save middleware to ensure data consistency
customerSchema.pre("save", function (next) {
  // Capitalize first letter of names and locations
  if (this.firstName)
    this.firstName =
      this.firstName.charAt(0).toUpperCase() +
      this.firstName.slice(1).toLowerCase();
  if (this.middleName)
    this.middleName =
      this.middleName.charAt(0).toUpperCase() +
      this.middleName.slice(1).toLowerCase();
  if (this.lastName)
    this.lastName =
      this.lastName.charAt(0).toUpperCase() +
      this.lastName.slice(1).toLowerCase();
  if (this.village)
    this.village =
      this.village.charAt(0).toUpperCase() +
      this.village.slice(1).toLowerCase();
  if (this.district)
    this.district =
      this.district.charAt(0).toUpperCase() +
      this.district.slice(1).toLowerCase();
  if (this.state)
    this.state =
      this.state.charAt(0).toUpperCase() + this.state.slice(1).toLowerCase();

  next();
});

const CustomerModel = mongoose.model<ICustomer>("Customer", customerSchema);

export default CustomerModel;
