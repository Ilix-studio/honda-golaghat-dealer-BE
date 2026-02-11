"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureProfileComplete = exports.ensureCustomerOwnership = exports.protectAdminOrCustomer = exports.optionalCustomerAuth = exports.protectCustomer = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const BaseCustomer_1 = require("../models/CustomerSystem/BaseCustomer");
const CustomerProfile_1 = require("../models/CustomerSystem/CustomerProfile");
// Initialize Firebase Admin if not already done
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert({
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID || "tsangpool-honda-otp",
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, "\n"),
            client_email: process.env.FIREBASE_CLIENT_EMAIL ||
                "firebase-adminsdk-fbsvc@tsangpool-honda-otp.iam.gserviceaccount.com",
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
            universe_domain: "googleapis.com",
        }),
    });
}
/**
 * Protect customer routes - requires customer authentication
 * Uses Firebase token verification
 */
exports.protectCustomer = (0, express_async_handler_1.default)(async (req, res, next) => {
    var _a;
    let token;
    if ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            console.log("Token received:", token.substring(0, 50) + "...");
            // Verify Firebase token
            const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
            console.log("Token decoded successfully, UID:", decodedToken.uid);
            // Find customer by Firebase UID using BaseCustomer model
            const customer = await BaseCustomer_1.BaseCustomerModel.findOne({
                firebaseUid: decodedToken.uid,
            });
            if (!customer) {
                console.log("No customer found with UID:", decodedToken.uid);
                res.status(401);
                throw new Error("Customer not found with this token");
            }
            if (!customer.isVerified) {
                console.log("Customer not verified:", customer.phoneNumber);
                res.status(401);
                throw new Error("Customer account is not verified");
            }
            req.customer = customer;
            next();
        }
        catch (error) {
            console.error("Firebase token verification detailed error:");
            console.error("Error message:", error.message);
            console.error("Error code:", error.code);
            console.error("Full error:", JSON.stringify(error, null, 2));
            res.status(401);
            throw new Error("Not authorized, invalid token");
        }
    }
    else {
        res.status(401);
        throw new Error("Not authorized, no token provided");
    }
});
/**
 * Optional customer authentication - doesn't throw error if no token
 */
exports.optionalCustomerAuth = (0, express_async_handler_1.default)(async (req, res, next) => {
    var _a;
    let token;
    if ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
            const customer = await BaseCustomer_1.BaseCustomerModel.findOne({
                firebaseUid: decodedToken.uid,
            });
            if (customer && customer.isVerified) {
                req.customer = customer;
            }
        }
        catch (error) {
            // Silently fail for optional auth
            console.log("Optional auth failed:", error);
        }
    }
    next();
});
/**
 * Combined middleware for admin or customer access
 * Checks both Firebase token (customer) and JWT token (admin)
 */
exports.protectAdminOrCustomer = (0, express_async_handler_1.default)(async (req, res, next) => {
    var _a;
    let firebaseToken;
    if ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.startsWith("Bearer")) {
        firebaseToken = req.headers.authorization.split(" ")[1];
        try {
            // First try Firebase token (customer)
            const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(firebaseToken);
            const customer = await BaseCustomer_1.BaseCustomerModel.findOne({
                firebaseUid: decodedToken.uid,
            });
            if (customer && customer.isVerified) {
                req.customer = customer;
                return next();
            }
        }
        catch (firebaseError) {
            // If Firebase fails, try JWT token (admin)
            try {
                const { verifyToken } = require("../utils/jwt");
                const decoded = verifyToken(firebaseToken);
                // Check admin or branch manager (reuse existing logic)
                const Admin = require("../models/Admin");
                const BranchManager = require("../models/BranchManager");
                let user = await Admin.findById(decoded.id).select("-password");
                if (!user) {
                    user = await BranchManager.findById(decoded.id)
                        .select("-password")
                        .populate("branch", "name address");
                    if (user) {
                        user.role = "Branch-Admin";
                    }
                }
                if (user) {
                    req.user = user;
                    return next();
                }
            }
            catch (jwtError) {
                console.error("JWT verification also failed:", jwtError);
            }
        }
    }
    res.status(401);
    throw new Error("Not authorized, invalid or missing token");
});
/**
 * Check if customer owns the resource
 */
const ensureCustomerOwnership = (customerIdParam = "customerId") => {
    return (req, res, next) => {
        if (!req.customer) {
            return next(new errorResponse_1.default("Customer authentication required", 401));
        }
        const resourceCustomerId = req.params[customerIdParam];
        if (req.customer._id.toString() !== resourceCustomerId) {
            return next(new errorResponse_1.default("Access denied: can only access own data", 403));
        }
        next();
    };
};
exports.ensureCustomerOwnership = ensureCustomerOwnership;
/**
 * Verify customer profile completion
 * Now checks the separate CustomerProfile model
 */
exports.ensureProfileComplete = (0, express_async_handler_1.default)(async (req, res, next) => {
    if (!req.customer) {
        return next(new errorResponse_1.default("Customer authentication required", 401));
    }
    const profile = await CustomerProfile_1.CustomerProfileModel.findOne({
        customer: req.customer._id,
    });
    if (!profile || !profile.profileCompleted) {
        const requiredFields = [
            "firstName",
            "lastName",
            "village",
            "district",
            "state",
        ];
        const missingFields = requiredFields.filter((field) => !(profile === null || profile === void 0 ? void 0 : profile[field]));
        res.status(400).json({
            success: false,
            error: "Profile incomplete",
            message: `Please complete your profile. Missing: ${missingFields.join(", ")}`,
            missingFields,
        });
        return;
    }
    next();
});
