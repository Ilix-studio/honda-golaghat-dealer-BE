"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Admin_1 = __importDefault(require("../models/Admin"));
const BranchManager_1 = __importDefault(require("../models/BranchManager"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorResponse_1 = __importDefault(require("../utils/errorResponse"));
const jwt_1 = require("../utils/jwt");
const user_types_1 = require("../types/user.types");
dotenv_1.default.config();
exports.protect = (0, express_async_handler_1.default)(async (req, res, next) => {
    let token;
    // Check if token exists in Authorization header
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        try {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];
            // Verify token
            const decoded = (0, jwt_1.verifyToken)(token);
            let user = null;
            // First try to find as Admin
            const admin = await Admin_1.default.findById(decoded.id).select("-password");
            if (admin) {
                user = admin;
            }
            else {
                // Then try to find as BranchManager
                const branchManager = await BranchManager_1.default.findById(decoded.id)
                    .select("-password")
                    .populate("branch", "name address");
                if (branchManager) {
                    // Add the role property for BranchManager
                    const branchManagerWithRole = Object.assign(branchManager, {
                        role: "Branch-Admin",
                    });
                    user = branchManagerWithRole;
                }
            }
            if (!user) {
                res.status(401);
                throw new Error("User not found with this token");
            }
            req.user = user;
            next();
        }
        catch (error) {
            console.error("Token verification error:", error);
            res.status(401);
            throw new Error("Not authorized, token failed");
        }
    }
    else {
        res.status(401);
        throw new Error("Not authorized, no token");
    }
});
// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorResponse_1.default("User not found", 401));
        }
        const userRole = (0, user_types_1.getUserRole)(req.user);
        if (!roles.includes(userRole)) {
            return next(new errorResponse_1.default(`User role ${userRole} is not authorized to access this route`, 403));
        }
        next();
    };
};
exports.authorize = authorize;
