import mongoose, { Document, Schema } from "mongoose";

export interface StaffMember {
  name: string;
  position: string;
}

export interface HoursType {
  weekdays: string;
  saturday: string;
  sunday: string;
}

export interface IBranch extends Document {
  id: string;
  branchName: string;
  address: string;
  phone: string;
  email: string;
  hours: HoursType;
  staff: StaffMember[];
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<StaffMember>({
  name: {
    type: String,
    required: [true, "Please add staff member name"],
  },
  position: {
    type: String,
    required: [true, "Please add staff member position"],
  },
});

const HoursSchema = new Schema<HoursType>({
  weekdays: {
    type: String,
    required: [true, "Please add weekday hours"],
  },
  saturday: {
    type: String,
    required: [true, "Please add Saturday hours"],
  },
  sunday: {
    type: String,
    required: [true, "Please add Sunday hours"],
  },
});

const BranchSchema = new Schema<IBranch>(
  {
    id: {
      type: String,
      required: [true, "Please add a branch ID"],
      unique: true,
      trim: true,
    },
    branchName: {
      type: String,
      required: [true, "Please add branch name"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Please add branch address"],
    },
    phone: {
      type: String,
      required: [true, "Please add phone number"],
    },
    email: {
      type: String,
      required: [true, "Please add email"],
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    hours: {
      type: HoursSchema,
      required: [true, "Please add branch hours"],
    },
    staff: [StaffSchema],
  },
  {
    timestamps: true,
  }
);

const Branch = mongoose.model<IBranch>("Branch", BranchSchema);

export default Branch;
