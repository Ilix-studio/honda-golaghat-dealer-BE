// src/controllers/customer.controller.ts
import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import admin from "firebase-admin";

import mongoose from "mongoose";
import CustomerModel, {
  ICustomer,
} from "../../models/CustomerSystem/CustomerModel";
import logger from "../../utils/logger";

/**
 * @desc    Register customer with phone number and send OTP
 * @route   POST /api/customers/register
 * @access  Public
 */
export const registerCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      res.status(400);
      throw new Error("Phone number is required");
    }

    // Check if customer already exists
    const existingCustomer = await CustomerModel.findOne({ phoneNumber });
    if (existingCustomer) {
      res.status(400);
      throw new Error("Customer with this phone number already exists");
    }

    // Create unverified customer record
    const customer = await CustomerModel.create({
      phoneNumber,
      firstName: "temp", // Temporary, will be updated in profile creation
      lastName: "temp",
      village: "temp",
      postOffice: "temp",
      policeStation: "temp",
      district: "temp",
      state: "temp",
      isVerified: false,
    });

    logger.info(`Customer registration initiated for phone: ${phoneNumber}`);

    res.status(201).json({
      success: true,
      message:
        "Customer registered. Complete OTP verification and create profile.",
      data: {
        customerId: customer._id,
        phoneNumber: customer.phoneNumber,
      },
    });
  }
);

/**
 * @desc    Verify OTP and link Firebase UID
 * @route   POST /api/customers/verify-otp
 * @access  Public
 */
export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber, idToken } = req.body;

  if (!phoneNumber || !idToken) {
    res.status(400);
    throw new Error("Phone number and ID token are required");
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Find customer by phone number
    const customer = await CustomerModel.findOne({ phoneNumber });
    if (!customer) {
      res.status(404);
      throw new Error("Customer not found. Please register first.");
    }

    // Update customer with Firebase UID and verify
    customer.firebaseUid = decodedToken.uid;
    customer.isVerified = true;
    await customer.save();

    logger.info(`Customer verified: ${phoneNumber}`);

    res.status(200).json({
      success: true,
      message: "OTP verified successfully. Please complete your profile.",
      data: {
        customerId: customer._id,
        isVerified: customer.isVerified,
        needsProfile: !customer.firstName || customer.firstName === "temp",
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(400);
    throw new Error("Invalid OTP or verification failed");
  }
});

/**
 * @desc    Customer login with Firebase token
 * @route   POST /api/customers/login
 * @access  Public
 */
export const customerLogin = asyncHandler(
  async (req: Request, res: Response) => {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400);
      throw new Error("ID token is required");
    }

    try {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Find customer by Firebase UID
      const customer = await CustomerModel.findOne({
        firebaseUid: decodedToken.uid,
      });

      if (!customer) {
        res.status(404);
        throw new Error("Customer not found. Please register first.");
      }

      if (!customer.isVerified) {
        res.status(401);
        throw new Error("Customer account is not verified");
      }

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          customer: {
            _id: customer._id,
            phoneNumber: customer.phoneNumber,
            fullName: customer.fullName,
            email: customer.email,
            isVerified: customer.isVerified,
          },
          token: idToken, // Client already has this token
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401);
      throw new Error("Invalid token or login failed");
    }
  }
);

/**
 * @desc    Create customer profile
 * @route   POST /api/customers/profile
 * @access  Private (Customer)
 */
export const createProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      firstName,
      middleName,
      lastName,
      email,
      village,
      postOffice,
      policeStation,
      district,
      state,
    } = req.body;

    if (!req.customer) {
      res.status(401);
      throw new Error("Customer authentication required");
    }

    // Update customer profile
    const updatedCustomer = await CustomerModel.findByIdAndUpdate(
      req.customer._id,
      {
        firstName,
        middleName,
        lastName,
        email,
        village,
        postOffice,
        policeStation,
        district,
        state,
      },
      { new: true, runValidators: true }
    );

    logger.info(`Profile created for customer: ${req.customer.phoneNumber}`);

    res.status(200).json({
      success: true,
      message: "Profile created successfully",
      data: updatedCustomer,
    });
  }
);

/**
 * @desc    Get customer profile
 * @route   GET /api/customers/profile
 * @access  Private (Customer)
 */
export const getCustomerProfile = asyncHandler(
  async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: req.customer,
    });
  }
);

/**
 * @desc    Update customer profile
 * @route   PUT /api/customers/profile
 * @access  Private (Customer)
 */
export const updateCustomerProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const allowedUpdates = [
      "firstName",
      "middleName",
      "lastName",
      "email",
      "village",
      "postOffice",
      "policeStation",
      "district",
      "state",
    ];

    const updates: Partial<ICustomer> = {};
    Object.keys(req.body)
      .filter((key) => allowedUpdates.includes(key))
      .forEach((key) => {
        (updates as any)[key] = req.body[key];
      });

    const updatedCustomer = await CustomerModel.findByIdAndUpdate(
      req.customer!._id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedCustomer,
    });
  }
);

/**
 * @desc    Get all customers
 * @route   GET /api/customers
 * @access  Private (Admin)
 */
export const getAllCustomers = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (req.query.isVerified !== undefined) {
      filter.isVerified = req.query.isVerified === "true";
    }
    if (req.query.district) {
      filter.district = new RegExp(req.query.district as string, "i");
    }
    if (req.query.state) {
      filter.state = new RegExp(req.query.state as string, "i");
    }

    const total = await CustomerModel.countDocuments(filter);
    const customers = await CustomerModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: customers,
    });
  }
);

/**
 * @desc    Get customer by ID
 * @route   GET /api/customers/:id
 * @access  Private (Admin or Customer)
 */
export const getCustomerById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid customer ID");
    }

    const customer = await CustomerModel.findById(id);
    if (!customer) {
      res.status(404);
      throw new Error("Customer not found");
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  }
);

/**
 * @desc    Verify customer (Admin action)
 * @route   PUT /api/customers/:id/verify
 * @access  Private (Admin)
 */
export const verifyCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const customer = await CustomerModel.findByIdAndUpdate(
      id,
      { isVerified: true },
      { new: true }
    );

    if (!customer) {
      res.status(404);
      throw new Error("Customer not found");
    }

    logger.info(`Customer verified by admin: ${customer.phoneNumber}`);

    res.status(200).json({
      success: true,
      message: "Customer verified successfully",
      data: customer,
    });
  }
);

/**
 * @desc    Delete customer
 * @route   DELETE /api/customers/:id
 * @access  Private (Super-Admin)
 */
export const deleteCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const customer = await CustomerModel.findById(id);
    if (!customer) {
      res.status(404);
      throw new Error("Customer not found");
    }

    // Delete from Firebase Auth if exists
    if (customer.firebaseUid) {
      try {
        await admin.auth().deleteUser(customer.firebaseUid);
      } catch (error) {
        logger.warn(`Failed to delete Firebase user: ${error}`);
      }
    }

    await CustomerModel.findByIdAndDelete(id);

    logger.warn(`Customer deleted: ${customer.phoneNumber}`);

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  }
);

/**
 * @desc    Resend OTP
 * @route   POST /api/customers/resend-otp
 * @access  Public
 */
export const resendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;

  const customer = await CustomerModel.findOne({ phoneNumber });
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }

  if (customer.isVerified) {
    res.status(400);
    throw new Error("Customer is already verified");
  }

  // Firebase handles OTP resending on client side
  res.status(200).json({
    success: true,
    message: "OTP resend initiated. Check your phone for new OTP.",
  });
});

/**
 * @desc    Get customer statistics
 * @route   GET /api/customers/stats
 * @access  Private (Admin)
 */
export const getCustomerStats = asyncHandler(
  async (req: Request, res: Response) => {
    const totalCustomers = await CustomerModel.countDocuments();
    const verifiedCustomers = await CustomerModel.countDocuments({
      isVerified: true,
    });
    const unverifiedCustomers = totalCustomers - verifiedCustomers;

    // Get state-wise distribution
    const stateStats = await CustomerModel.aggregate([
      { $match: { isVerified: true } },
      { $group: { _id: "$state", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get district-wise distribution
    const districtStats = await CustomerModel.aggregate([
      { $match: { isVerified: true } },
      { $group: { _id: "$district", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Monthly registrations
    const monthlyStats = await CustomerModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        verifiedCustomers,
        unverifiedCustomers,
        verificationRate: `${(
          (verifiedCustomers / totalCustomers) *
          100
        ).toFixed(1)}%`,
        stateWiseDistribution: stateStats,
        topDistricts: districtStats,
        monthlyRegistrations: monthlyStats,
      },
    });
  }
);

/**
 * @desc    Search customers
 * @route   GET /api/customers/search?q=searchterm
 * @access  Private (Admin)
 */
export const searchCustomers = asyncHandler(
  async (req: Request, res: Response) => {
    const { q } = req.query;

    if (!q) {
      res.status(400);
      throw new Error("Search query is required");
    }

    const searchRegex = new RegExp(q as string, "i");

    const customers = await CustomerModel.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { phoneNumber: searchRegex },
        { email: searchRegex },
        { village: searchRegex },
        { district: searchRegex },
      ],
    }).limit(20);

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  }
);

/**
 * @desc    Get customers by location
 * @route   GET /api/customers/location/:district
 * @access  Private (Admin)
 */
export const getCustomersByLocation = asyncHandler(
  async (req: Request, res: Response) => {
    const { district } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      district: new RegExp(district, "i"),
      isVerified: true,
    };

    const total = await CustomerModel.countDocuments(filter);
    const customers = await CustomerModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      district,
      data: customers,
    });
  }
);
