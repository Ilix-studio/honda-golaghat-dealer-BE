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
exports.CustomerProfileModel = exports.BloodGroup = void 0;
// models/Customer/CustomerProfile.ts
const mongoose_1 = __importStar(require("mongoose"));
// Blood group enum
var BloodGroup;
(function (BloodGroup) {
    BloodGroup["A_POSITIVE"] = "A+";
    BloodGroup["A_NEGATIVE"] = "A-";
    BloodGroup["B_POSITIVE"] = "B+";
    BloodGroup["B_NEGATIVE"] = "B-";
    BloodGroup["AB_POSITIVE"] = "AB+";
    BloodGroup["AB_NEGATIVE"] = "AB-";
    BloodGroup["O_POSITIVE"] = "O+";
    BloodGroup["O_NEGATIVE"] = "O-";
})(BloodGroup || (exports.BloodGroup = BloodGroup = {}));
const customerProfileSchema = new mongoose_1.Schema({
    customer: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
            validator: function (v) {
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
            validator: function (v) {
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
}, {
    timestamps: true,
});
// Indexes
customerProfileSchema.index({ district: 1, state: 1 });
customerProfileSchema.index({ firstName: 1, lastName: 1 });
// Virtuals
customerProfileSchema
    .virtual("fullName")
    .get(function () {
    const parts = [this.firstName, this.middleName, this.lastName].filter(Boolean);
    return parts.join(" ");
});
customerProfileSchema
    .virtual("fullAddress")
    .get(function () {
    return `${this.village}, ${this.postOffice}, ${this.policeStation}, ${this.district}, ${this.state}`;
});
// Pre-save middleware for capitalization
customerProfileSchema.pre("save", function (next) {
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    if (this.firstName)
        this.firstName = capitalize(this.firstName);
    if (this.middleName)
        this.middleName = capitalize(this.middleName);
    if (this.lastName)
        this.lastName = capitalize(this.lastName);
    if (this.village)
        this.village = capitalize(this.village);
    if (this.district)
        this.district = capitalize(this.district);
    if (this.state)
        this.state = capitalize(this.state);
    next();
});
customerProfileSchema.set("toJSON", { virtuals: true });
customerProfileSchema.set("toObject", { virtuals: true });
exports.CustomerProfileModel = mongoose_1.default.model("CustomerProfile", customerProfileSchema);
