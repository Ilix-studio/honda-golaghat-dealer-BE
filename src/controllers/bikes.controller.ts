import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import Bikes from "../models/Bikes";
import mongoose from "mongoose";

/**
 * @desc    Add a new bike
 * @route   POST /api/bikes/addBikes
 * @access  Private
 */
export const addBikes = asyncHandler(async (req: Request, res: Response) => {
  const {
    modelName,
    category,
    year,
    price,
    engine,
    power,
    transmission,
    features,
    colors,
    images,
    inStock,
    quantity,
    branch,
  } = req.body;

  // Validate required fields
  if (
    !modelName ||
    !category ||
    !year ||
    !price ||
    !engine ||
    !power ||
    !transmission ||
    !branch
  ) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  // Validate category is one of the allowed values
  const validCategories = [
    "sport",
    "adventure",
    "cruiser",
    "touring",
    "naked",
    "electric",
  ];
  if (!validCategories.includes(category)) {
    res.status(400);
    throw new Error("Invalid category");
  }

  // Validate branch is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(branch)) {
    res.status(400);
    throw new Error("Invalid branch ID");
  }

  const newBike = await Bikes.create({
    modelName,
    category,
    year,
    price,
    engine,
    power,
    transmission,
    features: features || [],
    colors: colors || [],
    images: images || [],
    inStock: inStock !== undefined ? inStock : true,
    quantity: quantity || 0,
    branch,
  });

  res.status(201).json({
    success: true,
    data: newBike,
    message: "Bike added successfully",
  });
});

/**
 * @desc    Get all bikes with optional filtering
 * @route   POST /api/bikes/getBikes
 * @access  Public
 */
export const getBikes = asyncHandler(async (req: Request, res: Response) => {
  const {
    category,
    minPrice,
    maxPrice,
    inStock,
    branch,
    search,
    sortBy,
    limit = 10,
    page = 1,
  } = req.body;

  // Build query
  const query: any = {};

  // Add filters if provided
  if (category) {
    query.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = minPrice;
    if (maxPrice !== undefined) query.price.$lte = maxPrice;
  }

  if (inStock !== undefined) {
    query.inStock = inStock;
  }

  if (branch) {
    if (!mongoose.Types.ObjectId.isValid(branch)) {
      res.status(400);
      throw new Error("Invalid branch ID");
    }
    query.branch = branch;
  }

  // Add search functionality
  if (search) {
    query.$or = [
      { modelName: { $regex: search, $options: "i" } },
      { features: { $in: [new RegExp(search, "i")] } },
    ];
  }

  // Calculate pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Determine sort order
  let sort = {};
  switch (sortBy) {
    case "price-low":
      sort = { price: 1 };
      break;
    case "price-high":
      sort = { price: -1 };
      break;
    case "newest":
      sort = { year: -1 };
      break;
    case "engine-size":
      sort = { engine: -1 };
      break;
    case "power":
      sort = { power: -1 };
      break;
    default:
      sort = { createdAt: -1 }; // Default to newest added
  }

  // Get total count for pagination
  const total = await Bikes.countDocuments(query);

  // Execute query with pagination and sorting
  const bikes = await Bikes.find(query)
    .sort(sort)
    .limit(Number(limit))
    .skip(skip)
    .populate("branch", "name location");

  res.status(200).json({
    success: true,
    count: bikes.length,
    total,
    totalPages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
    data: bikes,
  });
});

/**
 * @desc    Get a single bike by ID
 * @route   POST /api/bikes/getBike/:id
 * @access  Public
 */
export const getBikeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid bike ID");
  }

  const bike = await Bikes.findById(id).populate("branch", "name location");

  if (!bike) {
    res.status(404);
    throw new Error("Bike not found");
  }

  res.status(200).json({
    success: true,
    data: bike,
  });
});

/**
 * @desc    Update a bike by ID
 * @route   POST /api/bikes/updateBike/:id
 * @access  Private
 */
export const updateBikeById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid bike ID");
    }

    // Validate category if provided
    if (updateData.category) {
      const validCategories = [
        "sport",
        "adventure",
        "cruiser",
        "touring",
        "naked",
        "electric",
      ];
      if (!validCategories.includes(updateData.category)) {
        res.status(400);
        throw new Error("Invalid category");
      }
    }

    // Validate branch if provided
    if (
      updateData.branch &&
      !mongoose.Types.ObjectId.isValid(updateData.branch)
    ) {
      res.status(400);
      throw new Error("Invalid branch ID");
    }

    const updatedBike = await Bikes.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedBike) {
      res.status(404);
      throw new Error("Bike not found");
    }

    res.status(200).json({
      success: true,
      data: updatedBike,
      message: "Bike updated successfully",
    });
  }
);

/**
 * @desc    Delete a bike by ID
 * @route   POST /api/bikes/deleteBike/:id
 * @access  Private
 */
export const deleteBikeById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid bike ID");
    }

    const bike = await Bikes.findByIdAndDelete(id);

    if (!bike) {
      res.status(404);
      throw new Error("Bike not found");
    }

    res.status(200).json({
      success: true,
      message: "Bike deleted successfully",
    });
  }
);
