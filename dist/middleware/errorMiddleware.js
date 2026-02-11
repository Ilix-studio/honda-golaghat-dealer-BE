"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeNotFound = exports.errorHandler = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (err, req, res, next) => {
    // Log the error
    logger_1.default.error(err.stack);
    // CRITICAL: Check if response has already been sent
    if (res.headersSent) {
        // If headers are already sent, delegate to the default Express error handler
        return next(err);
    }
    // Determine status code - only change if it's still 200
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    try {
        // Send error response
        res.status(statusCode).json({
            success: false,
            message: err.message,
            stack: process.env.NODE_ENV === "production" ? null : err.stack,
        });
    }
    catch (responseError) {
        // If we still can't send the response, log it and delegate to Express
        logger_1.default.error("Failed to send error response:", responseError);
        return next(err);
    }
};
exports.errorHandler = errorHandler;
const routeNotFound = (req, res, next) => {
    // Handle favicon requests silently
    if (req.originalUrl === "/favicon.ico") {
        if (!res.headersSent) {
            res.status(204).end();
        }
        return;
    }
    // CRITICAL: Check if response has already been sent
    if (res.headersSent) {
        return next();
    }
    // Create error for route not found
    const error = new Error(`Not Found - ${req.originalUrl}`);
    // Set status code and pass to error handler
    res.status(404);
    next(error);
};
exports.routeNotFound = routeNotFound;
