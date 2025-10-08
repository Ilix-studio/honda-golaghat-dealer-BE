import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { StockConceptModel } from "../../models/BikeSystemModel2/StockConcept";
import logger from "../../utils/logger";

/**
 * @desc    Create new stock item
 * @route   POST /api/stock-concept
 * @access  Private (Super-Admin, Branch-Admin)
 */
export const createStockItem = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      modelName,
      category,
      engineCC,

      engineNumber,
      chassisNumber,
      color,
      variant,
      yearOfManufacture,
      exShowroomPrice,
      roadTax = 0,
      branchId,
      location = "Warehouse",
      uniqueBookRecord,
    } = req.body;

    // Validate required fields
    if (
      !modelName ||
      !category ||
      !engineCC ||
      !engineNumber ||
      !chassisNumber ||
      !color ||
      !variant ||
      !yearOfManufacture ||
      !exShowroomPrice ||
      !branchId
    ) {
      res.status(400);
      throw new Error("Please provide all required fields");
    }

    // Generate stock ID
    const stockCount = await StockConceptModel.countDocuments();
    const stockId = `STK-${Date.now()}-${String(stockCount + 1).padStart(
      4,
      "0"
    )}`;

    // Calculate pricing
    const onRoadPrice = exShowroomPrice + roadTax;

    // Create stock item
    const stockItem = await StockConceptModel.create({
      stockId,
      modelName,
      category,
      engineCC,

      color,
      variant,
      yearOfManufacture,
      uniqueBookRecord,
      engineNumber: engineNumber.toUpperCase(),
      chassisNumber: chassisNumber.toUpperCase(),
      stockStatus: {
        status: "Available",
        location,
        branchId,
        lastUpdated: new Date(),
        updatedBy: req.user!._id,
      },
      priceInfo: {
        exShowroomPrice,
        roadTax,
        onRoadPrice,
      },
    });

    await stockItem.populate([
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
      filter["category"] = req.query.category;
    }
    if (req.query.fuelType) {
      filter["fuelType"] = req.query.fuelType;
    }

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, "i");
      filter.$or = [
        { stockId: searchRegex },
        { modelName: searchRegex },
        { engineNumber: searchRegex },
        { chassisNumber: searchRegex },
      ];
    }

    const total = await StockConceptModel.countDocuments(filter);
    const stockItems = await StockConceptModel.find(filter)
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

export const getStockItemById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid stock item ID");
    }

    const stockItem = await StockConceptModel.findById(id).populate(
      "stockStatus.branchId",
      "branchName address phone"
    );

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
