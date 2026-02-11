"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("./logger"));
const generateToken = (payload) => {
    // Verify secret exists
    if (!process.env.JWT_SECRET) {
        logger_1.default.error("JWT secret is not configured");
        throw new Error("JWT secret is not configured");
    }
    try {
        const options = {
            expiresIn: "30d",
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, options);
        // Log token generation (first few characters only)
        logger_1.default.debug("Token generated successfully:", {
            payload,
            tokenPrefix: token.substring(0, 10) + "...",
        });
        return token;
    }
    catch (error) {
        logger_1.default.error("Token generation failed:", error);
        throw new Error("Failed to generate authentication token");
    }
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT secret is not configured");
    }
    return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
};
exports.verifyToken = verifyToken;
