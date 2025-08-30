import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import CustomerModel, {
  ICustomer,
} from "../models/CustomerSystem/CustomerModel";
import ErrorResponse from "../utils/errorResponse";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK (do this in your server.ts or config file)
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   // Add your Firebase config
// });

// Extend Request interface to include customer
declare global {
  namespace Express {
    interface Request {
      customer?: ICustomer;
    }
  }
}

/**
 * Protect routes - Verify Firebase token and get customer
 */
export const protectCustomer = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;

    // Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        // Get token from header
        token = req.headers.authorization.split(" ")[1];

        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Find customer by Firebase UID
        const customer = await CustomerModel.findOne({
          firebaseUid: decodedToken.uid,
        });

        if (!customer) {
          res.status(401);
          throw new Error("Customer not found with this token");
        }

        if (!customer.isVerified) {
          res.status(401);
          throw new Error("Customer account is not verified");
        }

        req.customer = customer;
        next();
      } catch (error) {
        console.error("Firebase token verification error:", error);
        res.status(401);
        throw new Error("Not authorized, invalid token");
      }
    } else {
      res.status(401);
      throw new Error("Not authorized, no token provided");
    }
  }
);

/**
 * Optional customer authentication - doesn't throw error if no token
 */
export const optionalCustomerAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        token = req.headers.authorization.split(" ")[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        const customer = await CustomerModel.findOne({
          firebaseUid: decodedToken.uid,
        });

        if (customer && customer.isVerified) {
          req.customer = customer;
        }
      } catch (error) {
        // Silently fail for optional auth
        console.log("Optional auth failed:");
      }
    }

    next();
  }
);

/**
 * Combined middleware for admin or customer access
 * Checks both admin token and customer token
 */
export const protectAdminOrCustomer = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      try {
        // First try Firebase token (customer)
        const decodedToken = await admin.auth().verifyIdToken(token);
        const customer = await CustomerModel.findOne({
          firebaseUid: decodedToken.uid,
        });

        if (customer && customer.isVerified) {
          req.customer = customer;
          return next();
        }
      } catch (firebaseError) {
        // If Firebase fails, try JWT token (admin)
        try {
          const { verifyToken } = require("../utils/jwt");
          const decoded = verifyToken(token);

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
        } catch (jwtError) {
          console.error("JWT verification also failed:", jwtError);
        }
      }
    }

    res.status(401);
    throw new Error("Not authorized, invalid or missing token");
  }
);

/**
 * Check if customer owns the resource
 * Use this for routes where customers can only access their own data
 */
export const ensureCustomerOwnership = (
  customerIdParam: string = "customerId"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.customer) {
      return next(new ErrorResponse("Customer authentication required", 401));
    }

    const resourceCustomerId = req.params[customerIdParam];

    if (req.customer._id.toString() !== resourceCustomerId) {
      return next(
        new ErrorResponse("Access denied: can only access own data", 403)
      );
    }

    next();
  };
};

/**
 * Verify customer profile completion
 */
export const ensureProfileComplete = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.customer) {
    return next(new ErrorResponse("Customer authentication required", 401));
  }

  const requiredFields = [
    "firstName",
    "lastName",
    "village",
    "district",
    "state",
  ];
  const missingFields = requiredFields.filter((field) => !req.customer![field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Profile incomplete",
      message: `Please complete your profile. Missing: ${missingFields.join(
        ", "
      )}`,
      missingFields,
    });
  }

  next();
};
