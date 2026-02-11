"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// models/EnquiryModel.ts
const mongoose_1 = __importStar(require("mongoose"));
const enquirySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        maxlength: [100, "Name cannot be more than 100 characters"],
    },
    phoneNumber: {
        type: String,
        required: [true, "Phone number is required"],
        match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number"],
        trim: true,
    },
    address: {
        village: {
            type: String,
            required: [true, "Street address is required"],
            trim: true,
            maxlength: [200, "Street address cannot exceed 200 characters"],
        },
        district: {
            type: String,
            required: [true, "City is required"],
            trim: true,
            maxlength: [100, "City name cannot exceed 100 characters"],
        },
        state: {
            type: String,
            required: [true, "State is required"],
            trim: true,
            maxlength: [50, "State name cannot exceed 50 characters"],
        },
        pinCode: {
            type: String,
            required: [true, "Postal code is required"],
            trim: true,
            maxlength: [6, "Postal code cannot exceed 6 characters"],
        },
    },
    status: {
        type: String,
        enum: ["new", "contacted", "resolved"],
        default: "new",
    },
}, {
    timestamps: true,
});
// Pre-save middleware for capitalization
enquirySchema.pre("save", function (next) {
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    if (this.name)
        this.name = this.name.trim();
    if (this.address.district)
        this.address.district = capitalize(this.address.district);
    if (this.address.state)
        this.address.state = capitalize(this.address.state);
    next();
});
// Virtual for full address
enquirySchema.virtual("fullAddress").get(function () {
    return `${this.address.village}, ${this.address.district}, ${this.address.state}, ${this.address.pinCode}`;
});
enquirySchema.set("toJSON", { virtuals: true });
enquirySchema.set("toObject", { virtuals: true });
const EnquiryModel = mongoose_1.default.model("Enquiry", enquirySchema);
exports.default = EnquiryModel;
