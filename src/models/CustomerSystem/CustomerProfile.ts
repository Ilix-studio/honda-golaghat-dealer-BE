// models/Customer/CustomerProfile.ts
import mongoose, { Document, Schema } from "mongoose";
import { IBaseCustomer } from "./BaseCustomer";

// Blood group enum
export enum BloodGroup {
  A_POSITIVE = "A+",
  A_NEGATIVE = "A-",
  B_POSITIVE = "B+",
  B_NEGATIVE = "B-",
  AB_POSITIVE = "AB+",
  AB_NEGATIVE = "AB-",
  O_POSITIVE = "O+",
  O_NEGATIVE = "O-",
}

export interface ICustomerProfile extends Document {
  _id: string;
  customer: mongoose.Types.ObjectId;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  village: string;
  postOffice: string;
  policeStation: string;
  district: string;
  state: string;
  bloodGroup: BloodGroup;
  familyNumber1: number;
  familyNumber2: number;
  profileCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerProfileSchema = new Schema<ICustomerProfile>(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseCustomer",
      required: [true, "Customer reference is required"],
      unique: true,
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
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: {
        values: Object.values(BloodGroup),
        message: "Blood group must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-",
      },
    },
    familyNumber1: {
      type: Number,
      required: [true, "Family contact number 1 is required"],
      validate: {
        validator: function (v: number) {
          return /^[6-9]\d{9}$/.test(v.toString());
        },
        message: "Please enter a valid 10-digit phone number starting with 6-9",
      },
      unique: true,
    },
    familyNumber2: {
      type: Number,
      required: [true, "Family contact number 2 is required"],
      validate: {
        validator: function (v: number) {
          return /^[6-9]\d{9}$/.test(v.toString());
        },
        message: "Please enter a valid 10-digit phone number starting with 6-9",
      },
      unique: true,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
customerProfileSchema.index({ district: 1, state: 1 });
customerProfileSchema.index({ firstName: 1, lastName: 1 });

// Virtuals
customerProfileSchema
  .virtual("fullName")
  .get(function (this: ICustomerProfile) {
    const parts = [this.firstName, this.middleName, this.lastName].filter(
      Boolean
    );
    return parts.join(" ");
  });

customerProfileSchema
  .virtual("fullAddress")
  .get(function (this: ICustomerProfile) {
    return `${this.village}, ${this.postOffice}, ${this.policeStation}, ${this.district}, ${this.state}`;
  });

// Pre-save middleware for capitalization
customerProfileSchema.pre("save", function (next) {
  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  if (this.firstName) this.firstName = capitalize(this.firstName);
  if (this.middleName) this.middleName = capitalize(this.middleName);
  if (this.lastName) this.lastName = capitalize(this.lastName);
  if (this.village) this.village = capitalize(this.village);
  if (this.district) this.district = capitalize(this.district);
  if (this.state) this.state = capitalize(this.state);

  next();
});

customerProfileSchema.set("toJSON", { virtuals: true });
customerProfileSchema.set("toObject", { virtuals: true });

export const CustomerProfileModel = mongoose.model<ICustomerProfile>(
  "CustomerProfile",
  customerProfileSchema
);

export interface ICustomerWithProfile extends IBaseCustomer {
  profile?: ICustomerProfile;
  fullName?: string;
  fullAddress?: string;
}
