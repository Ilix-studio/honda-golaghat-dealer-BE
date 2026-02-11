"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const allowOrigins_1 = __importDefault(require("./allowOrigins"));
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
            return callback(null, true);
        }
        // Check if origin is in allowed list
        if (allowOrigins_1.default.includes(origin)) {
            return callback(null, true);
        }
        // Log the rejected origin for debugging
        console.log(`CORS: Rejected origin - ${origin}`);
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
        "Cache-Control",
        "X-Forwarded-For",
    ],
};
exports.default = corsOptions;
