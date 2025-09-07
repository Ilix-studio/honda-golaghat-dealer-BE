import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import mongoose from "mongoose";
import MotorcycleInfo from "../../models/motorcycleMods/MotorcycleInfoModel";

/**
 * @desc    Create motorcycle info
 * @route   POST /api/motorcycle-info
 * @access  Private (Super-Admin, Branch-Admin)
 */
export const createMotorcycleInfo = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Validate required fields
      const {
        model,
        year,
        category,
        fuelType,
        bodyDimensions,
        engine,
        transmission,
        tyresBrakes,
        frameSuspension,
        electricals,
        mileage,
        topSpeed,
        priceRange,
      } = req.body;

      // Check for existing motorcycle with model
      const existingMotorcycle = await MotorcycleInfo.findOne({
        model,
        year,
        category,
        fuelType,
        bodyDimensions,
        engine,
        transmission,
        tyresBrakes,
        frameSuspension,
        electricals,
        mileage,
        topSpeed,
        priceRange,
      });

      if (existingMotorcycle) {
        res.status(400).json({
          success: false,
          error: "Motorcycle with model already exists",
        });
        return;
      }

      // Validate price range
      if (priceRange && priceRange.max <= priceRange.min) {
        res.status(400).json({
          success: false,
          error: "Maximum price must be greater than minimum price",
        });
        return;
      }

      // Create motorcycle info
      const motorcycleInfo = await MotorcycleInfo.create(req.body);

      res.status(201).json({
        success: true,
        message: "Motorcycle info created successfully",
        data: motorcycleInfo,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(
          (err: any) => err.message
        );
        res.status(400).json({
          success: false,
          error: "Validation Error",
          details: messages,
        });
      } else if (error.code === 11000) {
        res.status(400).json({
          success: false,
          error: "Duplicate entry: Motorcycle with model already exists",
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Failed to create motorcycle info",
          details: error.message,
        });
      }
    }
  }
);

/**
 * @desc    Get all motorcycle info (Admin)
 * @route   GET /api/motorcycle-info/admin/all
 * @access  Private (Super-Admin, Branch-Admin)
 */
export const getAllMotorcycleInfo = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Build filter
      const filter: any = {};

      if (req.query.category) {
        filter.category = req.query.category;
      }
      if (req.query.fuelType) {
        filter.fuelType = req.query.fuelType;
      }
      if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === "true";
      }
      if (req.query.year) {
        filter.year = parseInt(req.query.year as string);
      }

      const total = await MotorcycleInfo.countDocuments(filter);
      const motorcycles = await MotorcycleInfo.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        success: true,
        count: motorcycles.length,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        data: motorcycles,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch motorcycle info",
        details: error.message,
      });
    }
  }
);

/**
 * @desc    Get active motorcycles (Public)
 * @route   GET /api/motorcycle-info/active
 * @access  Public
 */
export const getActiveMotorcycles = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const filter: any = { isActive: true };

      if (req.query.category) {
        filter.category = req.query.category;
      }
      if (req.query.fuelType) {
        filter.fuelType = req.query.fuelType;
      }

      const total = await MotorcycleInfo.countDocuments(filter);
      const motorcycles = await MotorcycleInfo.find(filter)
        .select("-__v")
        .sort({ model: 1 })
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        success: true,
        count: motorcycles.length,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        data: motorcycles,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch active motorcycles",
        details: error.message,
      });
    }
  }
);

/**
 * @desc    Get motorcycle info by ID
 * @route   GET /api/motorcycle-info/:id
 * @access  Public
 */
export const getMotorcycleInfoById = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: "Invalid motorcycle ID",
        });
        return;
      }

      const motorcycle = await MotorcycleInfo.findById(id);

      if (!motorcycle) {
        res.status(404).json({
          success: false,
          error: "Motorcycle not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: motorcycle,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch motorcycle info",
        details: error.message,
      });
    }
  }
);

/**
 * @desc    Update motorcycle info
 * @route   PUT /api/motorcycle-info/:id
 * @access  Private (Super-Admin, Branch-Admin)
 */
export const updateMotorcycleInfo = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: "Invalid motorcycle ID",
        });
        return;
      }

      // Check if motorcycle exists
      const existingMotorcycle = await MotorcycleInfo.findById(id);
      if (!existingMotorcycle) {
        res.status(404).json({
          success: false,
          error: "Motorcycle not found",
        });
        return;
      }

      // If model are being updated, check for duplicates
      if (req.body.model) {
        const model = req.body.model || existingMotorcycle.model;

        const duplicateMotorcycle = await MotorcycleInfo.findOne({
          model,
          _id: { $ne: id },
        });

        if (duplicateMotorcycle) {
          res.status(400).json({
            success: false,
            error: "Motorcycle with model already exists",
          });
          return;
        }
      }

      // Validate price range if provided
      if (req.body.priceRange) {
        const { min, max } = req.body.priceRange;
        if (max && min && max <= min) {
          res.status(400).json({
            success: false,
            error: "Maximum price must be greater than minimum price",
          });
          return;
        }
      }

      const updatedMotorcycle = await MotorcycleInfo.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: "Motorcycle info updated successfully",
        data: updatedMotorcycle,
      });
    } catch (error: any) {
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(
          (err: any) => err.message
        );
        res.status(400).json({
          success: false,
          error: "Validation Error",
          details: messages,
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Failed to update motorcycle info",
          details: error.message,
        });
      }
    }
  }
);

/**
 * @desc    Delete motorcycle info
 * @route   DELETE /api/motorcycle-info/:id
 * @access  Private (Super-Admin only)
 */
export const deleteMotorcycleInfo = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: "Invalid motorcycle ID",
        });
        return;
      }

      const motorcycle = await MotorcycleInfo.findByIdAndDelete(id);

      if (!motorcycle) {
        res.status(404).json({
          success: false,
          error: "Motorcycle not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Motorcycle info deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Failed to delete motorcycle info",
        details: error.message,
      });
    }
  }
);

/**
 * @desc    Get motorcycles by category
 * @route   GET /api/motorcycle-info/category/:category
 * @access  Public
 */
export const getMotorcyclesByCategory = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const validCategories = [
        "Scooter",
        "Motorcycle",
        "Sport",
        "Cruiser",
        "Commuter",
      ];
      if (!validCategories.includes(category)) {
        res.status(400).json({
          success: false,
          error: `Invalid category. Must be one of: ${validCategories.join(
            ", "
          )}`,
        });
        return;
      }

      const filter: any = {
        category,
        isActive: true,
      };

      if (req.query.fuelType) {
        filter.fuelType = req.query.fuelType;
      }

      const total = await MotorcycleInfo.countDocuments(filter);
      const motorcycles = await MotorcycleInfo.find(filter)
        .sort({ model: 1 })
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        success: true,
        count: motorcycles.length,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        data: motorcycles,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch motorcycles by category",
        details: error.message,
      });
    }
  }
);

/**
 * @desc    Search motorcycles
 * @route   GET /api/motorcycle-info/search?q=searchterm
 * @access  Public
 */
export const searchMotorcycles = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        res.status(400).json({
          success: false,
          error: "Search query is required",
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const searchRegex = new RegExp(q.trim(), "i");

      const filter: any = {
        isActive: true,
        $or: [
          { model: searchRegex },
          { variant: searchRegex },
          { category: searchRegex },
          { fuelType: searchRegex },
          { features: { $in: [searchRegex] } },
        ],
      };

      const total = await MotorcycleInfo.countDocuments(filter);
      const motorcycles = await MotorcycleInfo.find(filter)
        .sort({ model: 1 })
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        success: true,
        count: motorcycles.length,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        data: motorcycles,
        searchTerm: q,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Failed to search motorcycles",
        details: error.message,
      });
    }
  }
);

/**
 * @desc    Get motorcycle statistics
 * @route   GET /api/motorcycle-info/admin/stats
 * @access  Private (Super-Admin, Branch-Admin)
 */
export const getMotorcycleStats = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const totalMotorcycles = await MotorcycleInfo.countDocuments();
      const activeMotorcycles = await MotorcycleInfo.countDocuments({
        isActive: true,
      });

      // Stats by category
      const categoryStats = await MotorcycleInfo.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Stats by fuel type
      const fuelTypeStats = await MotorcycleInfo.aggregate([
        { $group: { _id: "$fuelType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Price range stats
      const priceStats = await MotorcycleInfo.aggregate([
        {
          $group: {
            _id: null,
            avgMinPrice: { $avg: "$priceRange.min" },
            avgMaxPrice: { $avg: "$priceRange.max" },
            minPrice: { $min: "$priceRange.min" },
            maxPrice: { $max: "$priceRange.max" },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: {
          total: totalMotorcycles,
          active: activeMotorcycles,
          inactive: totalMotorcycles - activeMotorcycles,
          categoryBreakdown: categoryStats,
          fuelTypeBreakdown: fuelTypeStats,
          priceStatistics: priceStats[0] || {},
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch motorcycle statistics",
        details: error.message,
      });
    }
  }
);

/**
 * @desc    Bulk create motorcycles
 * @route   POST /api/motorcycle-info/admin/bulk-create
 * @access  Private (Super-Admin, Branch-Admin)
 */
export const bulkCreateMotorcycles = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { motorcycles } = req.body;

      if (!Array.isArray(motorcycles) || motorcycles.length === 0) {
        res.status(400).json({
          success: false,
          error: "Please provide an array of motorcycles",
        });
        return;
      }

      const results = {
        successful: [] as any[],
        failed: [] as any[],
      };

      for (let i = 0; i < motorcycles.length; i++) {
        try {
          const motorcycleData = motorcycles[i];

          // Check for existing motorcycle
          const existingMotorcycle = await MotorcycleInfo.findOne({
            model: motorcycleData.model,
          });

          if (existingMotorcycle) {
            results.failed.push({
              index: i,
              data: motorcycleData,
              error: "Motorcycle already exists",
            });
            continue;
          }

          const createdMotorcycle = await MotorcycleInfo.create(motorcycleData);
          results.successful.push(createdMotorcycle);
        } catch (error: any) {
          results.failed.push({
            index: i,
            data: motorcycles[i],
            error: error.message,
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `Bulk create completed. ${results.successful.length} successful, ${results.failed.length} failed`,
        data: results,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Failed to bulk create motorcycles",
        details: error.message,
      });
    }
  }
);
