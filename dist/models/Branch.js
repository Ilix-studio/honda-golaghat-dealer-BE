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
const mongoose_1 = __importStar(require("mongoose"));
const HoursSchema = new mongoose_1.Schema({
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
const BranchSchema = new mongoose_1.Schema({
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
    mapUrl: {
        type: String,
        required: false,
    },
}, {
    timestamps: true,
});
const Branch = mongoose_1.default.model("Branch", BranchSchema);
exports.default = Branch;
