"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPhoneNumbersBatch = exports.checkPhoneNumber = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const BaseCustomer_1 = require("../../models/CustomerSystem/BaseCustomer");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * @desc    Check if phone number exists in database
 * @route   POST /api/customer/check-phone
 * @access  Public
 */
exports.checkPhoneNumber = (0, express_async_handler_1.default)(async (req, res) => {
    const { phoneNumber } = req.body;
    // Validate input
    if (!phoneNumber) {
        res.status(400);
        throw new Error("Phone number is required");
    }
    // Validate phone number format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
        res.status(400);
        throw new Error("Invalid phone number format");
    }
    try {
        // Check if customer exists with this phone number
        const customer = await BaseCustomer_1.BaseCustomerModel.findOne({
            phoneNumber: phoneNumber,
        }).select("phoneNumber isVerified");
        const exists = !!customer;
        // Log the check for monitoring
        logger_1.default.info(`Phone number check: ${phoneNumber} - ${exists ? "Found" : "Not found"}`);
        res.status(200).json({
            success: true,
            exists,
            data: exists
                ? {
                    phoneNumber: customer.phoneNumber,
                    isVerified: customer.isVerified,
                }
                : null,
            message: exists
                ? "Phone number found in database"
                : "Phone number not found in database",
        });
    }
    catch (error) {
        logger_1.default.error(`Error checking phone number ${phoneNumber}:`, error);
        res.status(500);
        throw new Error("Database error occurred while checking phone number");
    }
});
/**
 * @desc    Batch check multiple phone numbers
 * @route   POST /api/customer/check-phones-batch
 * @access  Public (with rate limiting recommended)
 */
exports.checkPhoneNumbersBatch = (0, express_async_handler_1.default)(async (req, res) => {
    const { phoneNumbers } = req.body;
    // Validate input
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        res.status(400);
        throw new Error("Phone numbers array is required");
    }
    // Limit batch size to prevent abuse
    if (phoneNumbers.length > 10) {
        res.status(400);
        throw new Error("Maximum 10 phone numbers allowed per batch");
    }
    // Validate all phone number formats
    const phoneRegex = /^[6-9]\d{9}$/;
    const invalidNumbers = phoneNumbers.filter((phone) => !phoneRegex.test(phone));
    if (invalidNumbers.length > 0) {
        res.status(400);
        throw new Error(`Invalid phone number format: ${invalidNumbers.join(", ")}`);
    }
    try {
        // Check all phone numbers at once
        const customers = await BaseCustomer_1.BaseCustomerModel.find({
            phoneNumber: { $in: phoneNumbers },
        }).select("phoneNumber isVerified");
        // Create results map
        const results = phoneNumbers.map((phone) => {
            const customer = customers.find((c) => c.phoneNumber === phone);
            return {
                phoneNumber: phone,
                exists: !!customer,
                isVerified: (customer === null || customer === void 0 ? void 0 : customer.isVerified) || false,
            };
        });
        logger_1.default.info(`Batch phone check completed: ${phoneNumbers.length} numbers checked`);
        res.status(200).json({
            success: true,
            data: results,
            message: `Checked ${phoneNumbers.length} phone numbers`,
        });
    }
    catch (error) {
        logger_1.default.error(`Error in batch phone number check:`, error);
        res.status(500);
        throw new Error("Database error occurred while checking phone numbers");
    }
});
