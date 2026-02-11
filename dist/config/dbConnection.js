"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = process.env.MONGO_URI;
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(connectionString);
        console.log(`Mongo DB is connected successfully 🐟`);
    }
    catch (err) {
        console.error("Error connecting to MongoDB:", err);
        process.exit(1);
    }
};
exports.default = connectDB;
