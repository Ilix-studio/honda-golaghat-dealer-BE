import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from "cloudinary";
import { Request, Response } from "express";
import BikeModel from "../models/Bikes";

import { deleteFromCloudinary } from "../utils/cloudinaryHelper";

/**
 * @desc    Get all bikes with filtering and pagination
 * @route   GET /api/bikes
 * @access  Public
 */
export const getBikes = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const category = req.query.category as string;
  const year = req.query.year as string;
  const minPrice = req.query.minPrice as string;
  const maxPrice = req.query.maxPrice as string;
  const inStock = req.query.inStock as string;

  // Build filter query
  let filter: any = { isActive: true };

  if (category) filter.category = category;
  if (year) filter.year = parseInt(year);
  if (inStock === "true") filter.stockAvailable = { $gt: 0 };

  // Price filtering (using on-road price)
  if (minPrice || maxPrice) {
    filter["priceBreakdown.onRoadPrice"] = {};
    if (minPrice)
      filter["priceBreakdown.onRoadPrice"].$gte = parseFloat(minPrice);
    if (maxPrice)
      filter["priceBreakdown.onRoadPrice"].$lte = parseFloat(maxPrice);
  }

  const skip = (page - 1) * limit;

  const [bikes, total] = await Promise.all([
    BikeModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BikeModel.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      bikes,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    },
  });
});

/**
 * @desc    Get single bike by ID
 * @route   GET /api/bikes/:id
 * @access  Public
 */
export const getBikeById = asyncHandler(async (req: Request, res: Response) => {
  const bike = await BikeModel.findById(req.params.id);

  if (!bike || !bike.isActive) {
    res.status(404);
    throw new Error("Bike not found");
  }

  res.status(200).json({
    success: true,
    data: bike,
  });
});

/**
 * @desc    Add new bike with multiple images
 * @route   POST /api/bikes/add
 * @access  Private/Super-Admin
 */
export const addBikes = asyncHandler(async (req: Request, res: Response) => {
  const {
    modelName,
    category,
    year,
    variants,
    priceBreakdown,
    engineSize,
    power,
    transmission,
    features,
    colors,
    stockAvailable,
    isNewModel,
  } = req.body;

  // Validate required fields
  if (
    !modelName ||
    !category ||
    !year ||
    !priceBreakdown ||
    !engineSize ||
    !power ||
    !transmission
  ) {
    res.status(400).json({
      success: false,
      error: "Please provide all required fields",
    });
  }

  // Check for duplicate model name and year combination
  const existingBike = await BikeModel.findOne({
    modelName: modelName.trim(),
    year: parseInt(year),
    isActive: true,
  });

  if (existingBike) {
    res.status(400).json({
      success: false,
      error: `Bike model "${modelName}" for year ${year} already exists`,
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
    "commuter",
  ];
  if (!validCategories.includes(category)) {
    res.status(400).json({
      success: false,
      error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
    });
    return;
  }

  // Validate price breakdown
  if (
    !priceBreakdown.exShowroomPrice ||
    !priceBreakdown.rtoCharges ||
    !priceBreakdown.insuranceComprehensive
  ) {
    res.status(400).json({
      success: false,
      error:
        "Complete price breakdown is required (exShowroomPrice, rtoCharges, insuranceComprehensive)",
    });
    return;
  }

  // Check if files are uploaded
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    res.status(400).json({
      success: false,
      error: "At least one image is required",
    });
    return;
  }

  const files = req.files as Express.Multer.File[];

  try {
    // Upload all images to Cloudinary
    const uploadPromises = files.map((file, index) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "honda-golaghat-dealer/bikes",
              resource_type: "image",
              quality: "auto",
              format: "jpg",
              transformation: [
                { width: 800, height: 600, crop: "fill" },
                { quality: "auto" },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else
                resolve({
                  src: result!.secure_url,
                  alt: `${modelName} - Image ${index + 1}`,
                  cloudinaryPublicId: result!.public_id,
                  isPrimary: index === 0, // First image is primary
                });
            }
          )
          .end(file.buffer);
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);

    // Parse variants if it's a string
    let parsedVariants = variants;
    if (typeof variants === "string") {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (error) {
        res.status(400).json({
          success: false,
          error: "Invalid variants format",
        });
        return;
      }
    }

    // Parse features and colors if they're strings
    let parsedFeatures = features;
    if (typeof features === "string") {
      try {
        parsedFeatures = JSON.parse(features);
      } catch (error) {
        parsedFeatures = features.split(",").map((f: string) => f.trim());
      }
    }

    let parsedColors = colors;
    if (typeof colors === "string") {
      try {
        parsedColors = JSON.parse(colors);
      } catch (error) {
        parsedColors = colors.split(",").map((c: string) => c.trim());
      }
    }

    // Create bike document
    const bike = await BikeModel.create({
      modelName: modelName.trim(),
      category,
      year: parseInt(year),

      variants: parsedVariants || [
        {
          name: "Standard",
          features: [],
          priceAdjustment: 0,
          isAvailable: true,
        },
      ],
      priceBreakdown: {
        exShowroomPrice: parseFloat(priceBreakdown.exShowroomPrice),
        rtoCharges: parseFloat(priceBreakdown.rtoCharges),
        insuranceComprehensive: parseFloat(
          priceBreakdown.insuranceComprehensive
        ),
      },
      engineSize: engineSize.trim(),
      power: parseFloat(power),
      transmission: transmission.trim(),
      features: parsedFeatures || [],
      colors: parsedColors || [],
      images: uploadedImages,
      stockAvailable: parseInt(stockAvailable) || 0,
      isNewModel: isNewModel === "true" || isNewModel === true,
    });

    res.status(201).json({
      success: true,
      message: "Bike added successfully with images",
      data: bike,
    });
  } catch (error: any) {
    // Handle duplicate key error from MongoDB
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: "Bike model with this name and year already exists",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to create bike",
    });
  }
});

/**
 * @desc    Update bike with optional new images
 * @route   PUT /api/bikes/put/:id
 * @access  Private/Super-Admin
 */
export const updateBikeById = asyncHandler(
  async (req: Request, res: Response) => {
    const bike = await BikeModel.findById(req.params.id);

    if (!bike) {
      res.status(404);
      throw new Error("Bike not found");
    }

    const {
      modelName,
      category,
      year,
      variants,
      priceBreakdown,
      engineSize,
      power,
      transmission,
      features,
      colors,
      stockAvailable,
      isNewModel,
      isActive,
      removeImages, // Array of cloudinary public IDs to remove
    } = req.body;

    try {
      // Check for duplicate model name and year (excluding current bike)
      if (modelName && year) {
        const existingBike = await BikeModel.findOne({
          _id: { $ne: req.params.id },
          modelName: modelName.trim(),
          year: parseInt(year),
          isActive: true,
        });

        if (existingBike) {
          res.status(400).json({
            success: false,
            error: `Bike model "${modelName}" for year ${year} already exists`,
          });
          return;
        }
      }

      // Handle image removal if specified
      if (removeImages && Array.isArray(removeImages)) {
        for (const publicId of removeImages) {
          // Remove from Cloudinary
          await deleteFromCloudinary(
            `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}.jpg`
          );

          // Remove from bike images array
          bike.images = bike.images.filter(
            (img) => img.cloudinaryPublicId !== publicId
          );
        }
      }

      // Handle new image uploads
      let newImages: any[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const files = req.files as Express.Multer.File[];

        const uploadPromises = files.map((file, index) => {
          return new Promise((resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder: "honda-golaghat-dealer/bikes",
                  resource_type: "image",
                  quality: "auto",
                  format: "jpg",
                  transformation: [
                    { width: 800, height: 600, crop: "fill" },
                    { quality: "auto" },
                  ],
                },
                (error, result) => {
                  if (error) reject(error);
                  else
                    resolve({
                      src: result!.secure_url,
                      alt: `${bike.modelName} - Image ${
                        bike.images.length + index + 1
                      }`,
                      cloudinaryPublicId: result!.public_id,
                      isPrimary: bike.images.length === 0 && index === 0, // Primary only if no existing images
                    });
                }
              )
              .end(file.buffer);
          });
        });

        newImages = await Promise.all(uploadPromises);
        bike.images.push(...newImages);
      }

      // Update other fields
      if (modelName !== undefined) bike.modelName = modelName.trim();
      if (category !== undefined) bike.category = category;
      if (year !== undefined) bike.year = parseInt(year);

      if (variants !== undefined) {
        bike.variants =
          typeof variants === "string" ? JSON.parse(variants) : variants;
      }
      if (priceBreakdown !== undefined) {
        bike.priceBreakdown = {
          exShowroomPrice: parseFloat(priceBreakdown.exShowroomPrice),
          rtoCharges: parseFloat(priceBreakdown.rtoCharges),
          insuranceComprehensive: parseFloat(
            priceBreakdown.insuranceComprehensive
          ),
        };
      }
      if (engineSize !== undefined) bike.engineSize = engineSize.trim();
      if (power !== undefined) bike.power = parseFloat(power);
      if (transmission !== undefined) bike.transmission = transmission.trim();
      if (features !== undefined) {
        bike.features =
          typeof features === "string" ? JSON.parse(features) : features;
      }
      if (colors !== undefined) {
        bike.colors = typeof colors === "string" ? JSON.parse(colors) : colors;
      }
      if (stockAvailable !== undefined)
        bike.stockAvailable = parseInt(stockAvailable);
      if (isNewModel !== undefined)
        bike.isNewModel = isNewModel === "true" || isNewModel === true;
      if (isActive !== undefined)
        bike.isActive = isActive === "true" || isActive === true;

      // Ensure at least one image exists
      if (bike.images.length === 0) {
        res.status(400).json({
          success: false,
          error: "At least one image is required",
        });
        return;
      }

      const updatedBike = await bike.save();

      res.status(200).json({
        success: true,
        message: "Bike updated successfully",
        data: updatedBike,
      });
    } catch (error: any) {
      // Handle duplicate key error from MongoDB
      if (error.code === 11000) {
        res.status(400).json({
          success: false,
          error: "Bike model with this name and year already exists",
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error.message || "Failed to update bike",
      });
    }
  }
);

/**
 * @desc    Delete bike by ID
 * @route   DELETE /api/bikes/del/:id
 * @access  Private/Super-Admin
 */
export const deleteBikeById = asyncHandler(
  async (req: Request, res: Response) => {
    const bike = await BikeModel.findById(req.params.id);

    if (!bike) {
      res.status(404);
      throw new Error("Bike not found");
    }

    // Delete all images from Cloudinary
    for (const image of bike.images) {
      await deleteFromCloudinary(image.src);
    }

    // Delete bike from database
    await BikeModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Bike deleted successfully",
    });
  }
);

/**
 * @desc    Get bikes by category
 * @route   GET /api/bikes/category/:category
 * @access  Public
 */
export const getBikesByCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { category } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const validCategories = [
      "sport",
      "adventure",
      "cruiser",
      "touring",
      "naked",
      "electric",
      "commuter",
    ];
    if (!validCategories.includes(category)) {
      res.status(400).json({
        success: false,
        error: "Invalid category",
      });
      return;
    }

    const [bikes, total] = await Promise.all([
      BikeModel.find({ category, isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BikeModel.countDocuments({ category, isActive: true }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        bikes,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    });
  }
);

/**
 * @desc    Search bikes
 * @route   GET /api/bikes/search
 * @access  Public
 */
export const searchBikes = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  if (!query) {
    res.status(400).json({
      success: false,
      error: "Search query is required",
    });
    return;
  }

  const searchRegex = new RegExp(query as string, "i");
  const filter = {
    isActive: true,
    $or: [
      { modelName: searchRegex },
      { category: searchRegex },

      { features: { $in: [searchRegex] } },
      { colors: { $in: [searchRegex] } },
    ],
  };

  const [bikes, total] = await Promise.all([
    BikeModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BikeModel.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      bikes,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    },
  });
});
