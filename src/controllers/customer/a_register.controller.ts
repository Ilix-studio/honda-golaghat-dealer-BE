import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import CustomerModel from "../../models/CustomerSystem/CustomerModel";
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

    // Validate phone number format (10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
      res.status(400);
      throw new Error("Please enter a valid 10-digit phone number");
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
        "Customer registered successfully. OTP will be sent to your phone.",
      data: {
        customerId: customer._id,
        phoneNumber: customer.phoneNumber,
        requiresOtp: true, // Flag for frontend to proceed with OTP
      },
    });
  }
);
