"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginCustomer = exports.saveAuthData = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const logger_1 = __importDefault(require("../../utils/logger"));
const BaseCustomer_1 = require("../../models/CustomerSystem/BaseCustomer");
const CustomerProfile_1 = require("../../models/CustomerSystem/CustomerProfile");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
/**
 * @desc    Save customer data after Firebase OTP verification
 * @route   POST /api/customer/save-auth-data
 * @access  Public
 */
exports.saveAuthData = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { phoneNumber, firebaseUid } = req.body;
        if (!phoneNumber) {
            res.status(400);
            throw new Error("Phone number is required");
        }
        // Create or update base customer (only phone number and verification status)
        let customer = await BaseCustomer_1.BaseCustomerModel.findOne({ phoneNumber });
        if (customer) {
            // Update existing customer
            customer.isVerified = true;
            if (firebaseUid) {
                customer.firebaseUid = firebaseUid;
            }
            await customer.save();
        }
        else {
            // Create new customer
            customer = await BaseCustomer_1.BaseCustomerModel.create({
                phoneNumber,
                firebaseUid,
                isVerified: true,
            });
        }
        logger_1.default.info(`OTP verified for customer: ${phoneNumber}`);
        res.status(200).json({
            success: true,
            message: "OTP verification successful",
            data: {
                customer: {
                    _id: customer._id,
                    phoneNumber: customer.phoneNumber,
                    isVerified: customer.isVerified,
                    profileCompleted: false, // Profile not created yet
                },
            },
        });
    }
    catch (error) {
        console.warn("OTP verification error:", error);
        res.status(400);
        throw new Error("OTP verification failed");
    }
});
/**
 * @desc    Customer login
 * @route   POST /api/customer/login
 * @access  Public
 */
exports.loginCustomer = (0, express_async_handler_1.default)(async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) {
        res.status(400);
        throw new Error("ID token is required");
    }
    try {
        // Verify Firebase token
        const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(idToken);
        // Get phone number from verified token and normalize it
        let phoneNumber = decodedToken.phone_number;
        if (!phoneNumber) {
            res.status(400);
            throw new Error("Phone number not found in token");
        }
        // Normalize the phone number by removing the country code
        // If phone number starts with +91, remove it
        if (phoneNumber.startsWith("+91")) {
            phoneNumber = phoneNumber.substring(3); // Remove +91 prefix
        }
        // Find customer in your database with the normalized phone number
        const customer = await BaseCustomer_1.BaseCustomerModel.findOne({ phoneNumber });
        if (!customer) {
            res.status(404);
            throw new Error("Customer not found. Please register first.");
        }
        if (!customer.isVerified) {
            res.status(401);
            throw new Error("Customer account is not verified");
        }
        // Get profile
        const profile = await CustomerProfile_1.CustomerProfileModel.findOne({
            customer: customer._id,
        });
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                customer: {
                    _id: customer._id,
                    phoneNumber: customer.phoneNumber,
                    isVerified: customer.isVerified,
                    profileCompleted: !!(profile === null || profile === void 0 ? void 0 : profile.profileCompleted),
                },
                token: idToken,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        if (error instanceof Error) {
            // If the error is already set with a specific status, don't change it
            if (!res.statusCode || res.statusCode === 200) {
                res.status(401);
            }
            throw error;
        }
        else {
            res.status(500);
            throw new Error("An unexpected error occurred during login");
        }
    }
});
