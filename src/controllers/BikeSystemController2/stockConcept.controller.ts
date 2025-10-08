import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { StockConceptModel } from "../../models/BikeSystemModel2/StockConcept";
import BikeModel from "../../models/BikeSystemModel/Bikes";
import { BaseCustomerModel } from "../../models/CustomerSystem/BaseCustomer";
import { CustomerVehicleModel } from "../../models/BikeSystemModel2/CustomerVehicleModel";
import logger from "../../utils/logger";

/**
 * @desc    Create new stock item
 * @route   POST /api/stock-concept
 * @access  Private (Super-Admin, Branch-Admin)
 */
export const createStockItem = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      bikeModelId,
      engineNumber,
      chassisNumber,
      engineType,
      maxPower,
      maxTorque,
      displacement,
      color,
      variant,
      yearOfManufacture,
      fitnessUpto,
      exShowroomPrice,
      roadTax,
      insurance,
      additionalCharges,
      discount = 0,
      branchId,
      location = "Warehouse",
      uniqueBookRecord,
    } = req.body;

    // Validate required fields
    if (
      !bikeModelId ||
      !engineNumber ||
      !chassisNumber ||
      !engineType ||
      !color ||
      !variant ||
      !yearOfManufacture ||
      !fitnessUpto ||
      !exShowroomPrice ||
      !branchId
    ) {
      res.status(400);
      throw new Error("Please provide all required fields");
    }

    // Validate bike model exists
    if (!mongoose.Types.ObjectId.isValid(bikeModelId)) {
      res.status(400);
      throw new Error("Invalid bike model ID");
    }

    const bikeModel = await BikeModel.findById(bikeModelId);
    if (!bikeModel) {
      res.status(404);
      throw new Error("Bike model not found");
    }

    // Generate stock ID
    const stockCount = await StockConceptModel.countDocuments();
    const stockId = `STK-${Date.now()}-${String(stockCount + 1).padStart(
      4,
      "0"
    )}`;

    // Calculate pricing
    const onRoadPrice =
      exShowroomPrice +
      (roadTax || 0) +
      (insurance || 0) +
      (additionalCharges || 0);
    const finalPrice = onRoadPrice - discount;

    // Create stock item
    const stockItem = await StockConceptModel.create({
      stockId,
      bikeInfo: {
        bikeModelId,
        modelName: bikeModel.modelName,
        category: bikeModel.category,
        engineCC: parseInt(bikeModel.engineSize) || 0,
        fuelType: bikeModel.fuelNorms === "Electric" ? "Electric" : "Petrol",
        color,
        variant,
        yearOfManufacture,
      },
      uniqueBookRecord,
      engineDetails: {
        engineNumber: engineNumber.toUpperCase(),
        chassisNumber: chassisNumber.toUpperCase(),
        engineType,
        maxPower,
        maxTorque,
        displacement,
      },
      fitnessUpto,
      stockStatus: {
        status: "Available",
        location,
        branchId,
        lastUpdated: new Date(),
        updatedBy: req.user!._id,
      },
      priceInfo: {
        exShowroomPrice,
        roadTax: roadTax || 0,
        insurance: insurance || 0,
        additionalCharges: additionalCharges || 0,
        onRoadPrice,
        discount,
        finalPrice,
      },
    });

    await stockItem.populate([
      { path: "bikeInfo.bikeModelId", select: "modelName category" },
      { path: "stockStatus.branchId", select: "branchName address" },
    ]);

    logger.info(`Stock item created: ${stockItem.stockId} by ${req.user!._id}`);

    res.status(201).json({
      success: true,
      message: "Stock item created successfully",
      data: stockItem,
    });
  }
);

/**
 * @desc    Get all stock items
 * @route   GET /api/stock-concept
 * @access  Private (Super-Admin, Branch-Admin)
 */
export const getAllStockItems = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { isActive: true };

    if (req.query.status) {
      filter["stockStatus.status"] = req.query.status;
    }
    if (req.query.location) {
      filter["stockStatus.location"] = req.query.location;
    }
    if (req.query.branchId) {
      filter["stockStatus.branchId"] = req.query.branchId;
    }
    if (req.query.category) {
      filter["bikeInfo.category"] = req.query.category;
    }
    if (req.query.fuelType) {
      filter["bikeInfo.fuelType"] = req.query.fuelType;
    }

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, "i");
      filter.$or = [
        { stockId: searchRegex },
        { "bikeInfo.modelName": searchRegex },
        { "engineDetails.engineNumber": searchRegex },
        { "engineDetails.chassisNumber": searchRegex },
      ];
    }

    const total = await StockConceptModel.countDocuments(filter);
    const stockItems = await StockConceptModel.find(filter)
      .populate("bikeInfo.bikeModelId", "modelName category")
      .populate("stockStatus.branchId", "branchName address")
      .populate("salesInfo.soldTo", "phoneNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: stockItems.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: stockItems,
    });
  }
);

/**
 * @desc    Assign stock item to customer
 * @route   PATCH /api/stock-concept/:id/assign
 * @access  Private (Super-Admin, Branch-Admin)
 */
export const assignToCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      customerId,
      salePrice,
      salesPersonId,
      invoiceNumber,
      paymentStatus = "Pending",
      registrationDate,
      numberPlate,
      registeredOwnerName,
      insurance = false,
      isPaid = false,
      isFinance = false,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid stock item ID");
    }

    // Validate required fields
    if (!customerId || !salePrice || !salesPersonId || !invoiceNumber) {
      res.status(400);
      throw new Error(
        "Please provide customer, sale price, sales person, and invoice number"
      );
    }

    // Check stock item exists and is available
    const stockItem = await StockConceptModel.findById(id);
    if (!stockItem) {
      res.status(404);
      throw new Error("Stock item not found");
    }

    if (stockItem.stockStatus.status !== "Available") {
      res.status(400);
      throw new Error("Stock item is not available for sale");
    }

    // Validate customer exists
    const customer = await BaseCustomerModel.findById(customerId);
    if (!customer) {
      res.status(404);
      throw new Error("Customer not found");
    }

    // Create customer vehicle record
    const customerVehicle = await CustomerVehicleModel.create({
      stockConcept: stockItem._id,
      modelName: stockItem.bikeInfo.modelName,
      registrationDate: registrationDate
        ? new Date(registrationDate)
        : undefined,
      numberPlate: numberPlate?.toUpperCase(),
      insurance,
      isPaid,
      isFinance,
      color: stockItem.bikeInfo.color,
      customerPhoneNumber: customerId,
      registeredOwnerName: registeredOwnerName || undefined,
      rtoInfo: numberPlate
        ? {
            rtoCode: numberPlate.substring(0, 4).toUpperCase(),
            rtoName: "RTO Office",
            rtoAddress: "RTO Address",
            state: "AS",
          }
        : undefined,
      servicePackage: {
        packageId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"), // This should be set based on bike model
        currentServiceLevel: 1,
        nextServiceType: "firstService",
        completedServices: [],
      },
      serviceStatus: {
        serviceType: "Regular",
        kilometers: 0,
        serviceHistory: 0,
      },
      activeValueAddedServices: [],
    });

    // Update stock item with sales information
    stockItem.stockStatus.status = "Sold";
    stockItem.stockStatus.location = "Customer";
    stockItem.stockStatus.lastUpdated = new Date();

    stockItem.salesInfo = {
      soldTo: new mongoose.Types.ObjectId(customerId),
    };

    await stockItem.save();

    await stockItem.populate([
      { path: "salesInfo.soldTo", select: "phoneNumber" },
      { path: "stockStatus.branchId", select: "branchName" },
    ]);

    logger.info(
      `Stock item ${stockItem.stockId} assigned to customer ${
        customer.phoneNumber
      } by ${req.user!._id}`
    );

    res.status(200).json({
      success: true,
      message: "Stock item successfully assigned to customer",
      data: {
        stockItem,
        customerVehicle: {
          _id: customerVehicle._id,
          modelName: customerVehicle.modelName,
          numberPlate: customerVehicle.numberPlate,
        },
      },
    });
  }
);

/**
 * @desc    Get stock item by ID
 * @route   GET /api/stock-concept/:id
 * @access  Private (Super-Admin, Branch-Admin)
 */
export const getStockItemById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid stock item ID");
    }

    const stockItem = await StockConceptModel.findById(id)
      .populate(
        "bikeInfo.bikeModelId",
        "modelName category engineSize power transmission"
      )
      .populate("stockStatus.branchId", "branchName address phone")
      .populate("stockStatus.updatedBy", "name email")
      .populate("salesInfo.soldTo", "phoneNumber")
      .populate("salesInfo.salesPerson", "name email")
      .populate("salesInfo.customerVehicleId");

    if (!stockItem) {
      res.status(404);
      throw new Error("Stock item not found");
    }

    res.status(200).json({
      success: true,
      data: stockItem,
    });
  }
);
