// src/models/ContactMessage.ts
import mongoose, { Document, Schema } from "mongoose";

// Define the interface for a contact message
export interface IContactMessage extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  branch?: string;
  status: "new" | "read";
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        "Please provide a valid email address",
      ],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot be more than 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [5000, "Message cannot be more than 5000 characters"],
    },
    branch: {
      type: String,
      trim: true,
      default: "golaghat",
      //Set to option - golaghat or ther branch
    },
    status: {
      type: String,
      enum: ["new", "read"],
      default: "new",
    },
  },
  { timestamps: true }
);

// Create and export the model
export default mongoose.model<IContactMessage>(
  "ContactMessage",
  ContactMessageSchema
);
