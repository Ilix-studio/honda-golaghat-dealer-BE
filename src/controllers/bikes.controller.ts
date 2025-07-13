import multer from "multer";
import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";
import { Request, Response } from "express";
import Bikes from "../models/Bikes";
import mongoose from "mongoose";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinaryHelper";

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// Multer middleware for multiple files
export const uploadImages = upload.array("images", 10); // Max 10 images

export const addBikes = asyncHandler(async (req: Request, res: Response) => {
  console.log("=== addBikes Debug Info ===");
  console.log("Request body:", req.body);
  console.log("Files:", req.files);
  console.log("=== End Debug Info ===");

  // Check if req.body exists and is not empty
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).json({
      success: false,
      error:
        "Request body is missing or empty. Please send data in JSON format.",
    });
    return;
  }

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
    res.status(400).json({
      success: false,
      error:
        "Please provide all required fields: modelName, category, year, price, engine, power, transmission, branch",
    });
    return;
  }

  // Validate category
  const validCategories = [
    "sport",
    "adventure",
    "cruiser",
    "touring",
    "naked",
    "electric",
  ];
  if (!validCategories.includes(category)) {
    res.status(400).json({
      success: false,
      error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
    });
    return;
  }

  // Validate and clean numeric fields
  let cleanYear: number;
  let cleanPrice: number;
  let cleanPower: number;
  let cleanQuantity: number = 0;

  try {
    // Clean and validate year
    cleanYear = parseInt(String(year));
    if (
      isNaN(cleanYear) ||
      cleanYear < 1990 ||
      cleanYear > new Date().getFullYear() + 2
    ) {
      res.status(400).json({
        success: false,
        error:
          "Year must be a valid number between 1990 and " +
          (new Date().getFullYear() + 2),
      });
      return;
    }

    // Clean and validate price
    const priceStr = String(price).replace(/,/g, "");
    cleanPrice = parseFloat(priceStr);
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      res.status(400).json({
        success: false,
        error: "Price must be a valid positive number",
      });
      return;
    }

    // Clean and validate power
    const powerStr = String(power).replace(/[^\d.]/g, "");
    cleanPower = parseFloat(powerStr);
    if (isNaN(cleanPower) || cleanPower <= 0) {
      res.status(400).json({
        success: false,
        error: "Power must be a valid positive number",
      });
      return;
    }

    // Clean and validate quantity
    if (quantity !== undefined && quantity !== null && quantity !== "") {
      cleanQuantity = parseInt(String(quantity));
      if (isNaN(cleanQuantity) || cleanQuantity < 0) {
        res.status(400).json({
          success: false,
          error: "Quantity must be a valid non-negative number",
        });
        return;
      }
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Invalid numeric values provided",
    });
    return;
  }

  // Validate branch ID
  if (!mongoose.Types.ObjectId.isValid(branch)) {
    res.status(400).json({
      success: false,
      error: `Invalid branch ID. Must be a valid 24-character MongoDB ObjectId. Received: "${branch}" (${
        String(branch).length
      } characters)`,
    });
    return;
  }

  // Validate boolean fields
  let cleanInStock: boolean = true;
  if (inStock !== undefined && inStock !== null && inStock !== "") {
    if (typeof inStock === "string") {
      cleanInStock = inStock.toLowerCase() === "true";
    } else {
      cleanInStock = Boolean(inStock);
    }
  }

  // Handle image uploads
  let imageUrls: string[] = [];

  try {
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      console.log(`Uploading ${req.files.length} images to Cloudinary...`);

      // Upload all images to Cloudinary
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, file.originalname)
      );

      imageUrls = await Promise.all(uploadPromises);
      console.log("Images uploaded successfully:", imageUrls);
    }
  } catch (uploadError: any) {
    console.error("Error uploading images:", uploadError);
    res.status(500).json({
      success: false,
      error: "Failed to upload images to Cloudinary",
      details: uploadError.message,
    });
    return;
  }

  try {
    const newBike = await Bikes.create({
      modelName: String(modelName).trim(),
      category,
      year: cleanYear,
      price: cleanPrice,
      engine: String(engine).trim(),
      power: cleanPower,
      transmission: String(transmission).trim(),
      features: Array.isArray(features) ? features : [],
      colors: Array.isArray(colors) ? colors : [],
      images: imageUrls, // Store Cloudinary URLs
      inStock: cleanInStock,
      quantity: cleanQuantity,
      branch,
    });

    res.status(201).json({
      success: true,
      data: newBike,
      message: "Bike added successfully",
      uploadedImages: imageUrls.length,
    });
  } catch (error: any) {
    console.error("Error creating bike:", error);

    // If bike creation fails but images were uploaded, we should clean up
    if (imageUrls.length > 0) {
      console.log("Cleaning up uploaded images due to database error...");
      // Extract public_ids from URLs and delete from Cloudinary
      const cleanupPromises = imageUrls.map(async (url) => {
        try {
          const publicId = url.split("/").pop()?.split(".")[0];
          if (publicId) {
            await cloudinary.uploader.destroy(
              `honda-golaghat-dealer/bikes/${publicId}`
            );
          }
        } catch (cleanupError) {
          console.error("Error cleaning up image:", cleanupError);
        }
      });
      await Promise.allSettled(cleanupPromises);
    }

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors,
      });
      return;
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: "Duplicate entry detected",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Failed to create bike",
      details: error.message,
    });
  }
});
/**
 * @desc    Get all bikes with optional filtering
 * @route   GET /api/bikes (with query parameters)
 * @route   POST /api/bikes/search (with request body)
 * @access  Public
 */
export const getBikes = asyncHandler(async (req: Request, res: Response) => {
  console.log("=== getBikes Debug Info ===");
  console.log("Request method:", req.method);
  console.log("Query params:", req.query);
  console.log("Request body:", req.body);
  console.log("=== End Debug Info ===");

  let params: any = {};

  // For GET requests, use query parameters
  if (req.method === "GET") {
    params = req.query;
  } else {
    // For POST requests, use request body
    params = req.body || {};
  }

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
  } = params;

  // Build query
  const query: any = {};

  // Add filters if provided
  if (category) {
    query.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
  }

  if (inStock !== undefined) {
    // Handle string boolean values from query parameters
    if (typeof inStock === "string") {
      query.inStock = inStock.toLowerCase() === "true";
    } else {
      query.inStock = inStock;
    }
  }

  if (branch) {
    if (!mongoose.Types.ObjectId.isValid(branch)) {
      res.status(400).json({
        success: false,
        error: `Invalid branch ID: ${branch}`,
      });
      return;
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

  try {
    // Get total count for pagination
    const total = await Bikes.countDocuments(query);

    // Execute query with pagination and sorting
    const bikes = await Bikes.find(query)
      .sort(sort)
      .limit(Number(limit))
      .skip(skip)
      .populate("branch", "name address");

    res.status(200).json({
      success: true,
      count: bikes.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: bikes,
    });
  } catch (error: any) {
    console.error("Error fetching bikes:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch bikes",
      details: error.message,
    });
  }
});

/**
 * @desc    Get a single bike by ID
 * @route   GET /api/bikes/:id
 * @access  Public
 */
export const getBikeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({
      success: false,
      error: "Invalid bike ID",
    });
    return;
  }

  try {
    const bike = await Bikes.findById(id).populate("branch", "name address");

    if (!bike) {
      res.status(404).json({
        success: false,
        error: "Bike not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: bike,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch bike",
      details: error.message,
    });
  }
});

/**
 * @desc    Update a bike by ID
 * @route   PUT /api/bikes/:id
 * @access  Private
 */
export const updateBikeById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid bike ID",
      });
      return;
    }

    // Find existing bike first
    const existingBike = await Bikes.findById(id);
    if (!existingBike) {
      res.status(404).json({
        success: false,
        error: "Bike not found",
      });
      return;
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
        res.status(400).json({
          success: false,
          error: "Invalid category",
        });
        return;
      }
    }

    // Validate branch if provided
    if (
      updateData.branch &&
      !mongoose.Types.ObjectId.isValid(updateData.branch)
    ) {
      res.status(400).json({
        success: false,
        error: "Invalid branch ID",
      });
      return;
    }

    // Handle image uploads
    let newImageUrls: string[] = [];
    let finalImageUrls: string[] = [...existingBike.images]; // Start with existing images

    try {
      // Upload new images if provided
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        console.log(`Uploading ${req.files.length} new images...`);

        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file.buffer, file.originalname)
        );

        newImageUrls = await Promise.all(uploadPromises);
        console.log("New images uploaded successfully:", newImageUrls);

        // Handle image replacement strategy
        if (
          updateData.replaceImages === "true" ||
          updateData.replaceImages === true
        ) {
          // Replace all existing images with new ones
          const oldImages = existingBike.images;
          finalImageUrls = newImageUrls;

          // Delete old images from Cloudinary
          const deletePromises = oldImages.map(deleteFromCloudinary);
          await Promise.allSettled(deletePromises);
        } else {
          // Append new images to existing ones
          finalImageUrls = [...existingBike.images, ...newImageUrls];
        }

        // Update the images in updateData
        updateData.images = finalImageUrls;
      }

      // Handle explicit image URLs in updateData (for manual URL updates)
      if (
        updateData.images &&
        Array.isArray(updateData.images) &&
        req.files?.length === 0
      ) {
        finalImageUrls = updateData.images;
      }

      // Clean numeric fields if provided
      if (updateData.year) {
        const cleanYear = parseInt(String(updateData.year));
        if (
          isNaN(cleanYear) ||
          cleanYear < 1990 ||
          cleanYear > new Date().getFullYear() + 2
        ) {
          res.status(400).json({
            success: false,
            error:
              "Year must be a valid number between 1990 and " +
              (new Date().getFullYear() + 2),
          });
          return;
        }
        updateData.year = cleanYear;
      }

      if (updateData.price) {
        const priceStr = String(updateData.price).replace(/,/g, "");
        const cleanPrice = parseFloat(priceStr);
        if (isNaN(cleanPrice) || cleanPrice <= 0) {
          res.status(400).json({
            success: false,
            error: "Price must be a valid positive number",
          });
          return;
        }
        updateData.price = cleanPrice;
      }

      if (updateData.power) {
        const powerStr = String(updateData.power).replace(/[^\d.]/g, "");
        const cleanPower = parseFloat(powerStr);
        if (isNaN(cleanPower) || cleanPower <= 0) {
          res.status(400).json({
            success: false,
            error: "Power must be a valid positive number",
          });
          return;
        }
        updateData.power = cleanPower;
      }

      if (updateData.quantity !== undefined) {
        const cleanQuantity = parseInt(String(updateData.quantity));
        if (isNaN(cleanQuantity) || cleanQuantity < 0) {
          res.status(400).json({
            success: false,
            error: "Quantity must be a valid non-negative number",
          });
          return;
        }
        updateData.quantity = cleanQuantity;
      }

      // Handle boolean fields
      if (updateData.inStock !== undefined) {
        if (typeof updateData.inStock === "string") {
          updateData.inStock = updateData.inStock.toLowerCase() === "true";
        } else {
          updateData.inStock = Boolean(updateData.inStock);
        }
      }

      // Remove replaceImages flag from updateData before saving
      delete updateData.replaceImages;

      // Update the bike
      const updatedBike = await Bikes.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate("branch", "name address");

      res.status(200).json({
        success: true,
        data: updatedBike,
        message: "Bike updated successfully",
        uploadedImages: newImageUrls.length,
        totalImages: finalImageUrls.length,
      });
    } catch (uploadError: any) {
      console.error("Error uploading images:", uploadError);

      // Clean up any uploaded images if bike update fails
      if (newImageUrls.length > 0) {
        const cleanupPromises = newImageUrls.map(deleteFromCloudinary);
        await Promise.allSettled(cleanupPromises);
      }

      res.status(500).json({
        success: false,
        error: "Failed to upload images",
        details: uploadError.message,
      });
      return;
    }
  }
);

/**
 * @desc    Delete a bike by ID
 * @route   DELETE /api/bikes/:id
 * @access  Private
 */
export const deleteBikeById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid bike ID",
      });
      return;
    }

    try {
      const bike = await Bikes.findByIdAndDelete(id);

      if (!bike) {
        res.status(404).json({
          success: false,
          error: "Bike not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Bike deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Failed to delete bike",
        details: error.message,
      });
    }
  }
);
/**
 * @desc    Get all bikes without pagination for comparison
 * @route   GET /api/bikes/getallbikes
 * @access  Public
 */
export const getAllBikesForComparison = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Remove pagination for comparison - get all bikes
      const bikes = await Bikes.find()
        .populate("branch", "name address")
        .select(
          "modelName category year price engine power transmission features colors images inStock quantity"
        )
        .sort({ modelName: 1 });

      res.status(200).json({
        success: true,
        count: bikes.length,
        data: bikes,
      });
    } catch (error: any) {
      console.error("Error fetching all bikes:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch bikes for comparison",
        details: error.message,
      });
    }
  }
);

/**
 * @desc    Get bike by ID with comparison-optimized response
 * @route   GET /api/bikes/bikeId/:id
 * @access  Public
 */
export const getBikeByIdForComparison = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid bike ID",
      });
      return;
    }

    try {
      const bike = await Bikes.findById(id)
        .populate("branch", "name address")
        .select(
          "modelName category year price engine power transmission features colors images inStock quantity"
        );

      if (!bike) {
        res.status(404).json({
          success: false,
          error: "Bike not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: bike,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch bike for comparison",
        details: error.message,
      });
    }
  }
);
