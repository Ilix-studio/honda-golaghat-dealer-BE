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
const ScootySchema = new mongoose_1.Schema({
    modelName: {
        // Renamed from 'model' to 'modelName'
        type: String,
        required: [true, "Please add scooty model"],
        trim: true,
    },
    category: {
        type: String,
        required: [true, "Please add scooty category"],
        enum: ["sport", "adventure", "cruiser", "touring", "naked", "scooter"],
    },
    year: {
        type: Number,
        required: [true, "Please add manufacturing year"],
    },
    price: {
        type: Number,
        required: [true, "Please add price"],
    },
    engine: {
        type: String,
        required: [true, "Please add engine details"],
    },
    power: {
        type: String,
        required: [true, "Please add power specifications"],
    },
    features: [String],
    colors: [String],
    images: [
        {
            type: String,
            required: true,
        },
    ],
    inStock: {
        type: Boolean,
        default: true,
    },
    quantity: {
        type: Number,
        default: 0,
    },
    branch: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Branch",
        required: [true, "Please add a branch"],
    },
}, {
    timestamps: true,
});
const ScootyModel = mongoose_1.default.model("Scooty", ScootySchema);
exports.default = ScootyModel;
