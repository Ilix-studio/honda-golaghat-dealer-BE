import express from "express";
import {
  addBikes,
  createBike,
  uploadSingleBike,
  uploadMultipleBikes,
  deleteBikeById,
  getBikeById,
  getBikes,
  updateBikeById,
  getBikesByCategory,
  getBikesByMainCategory,
  getBikesByFuelNorms,
  getE20EfficientBikes,
  searchBikes,
} from "../controllers/bikes.controller";
import { protect, authorize } from "../middleware/authmiddleware";
import { bikeUploadConfig, handleMulterError } from "../config/multerConfig";

const router = express.Router();
// /api/bikes

// Public routes
router.get("/", getBikes);
router.get("/search", searchBikes);
router.get("/category/:category", getBikesByCategory);
router.get("/main-category/:mainCategory", getBikesByMainCategory);
router.get("/fuel-norms/:fuelNorms", getBikesByFuelNorms);
router.get("/e20-efficient", getE20EfficientBikes);
router.get("/:id", getBikeById);

// Protected routes (Super-Admin only)
// Create bike with existing image URLs (no file upload)
router.post("/create", protect, authorize("Super-Admin"), createBike);

// Single image upload (backward compatibility)
router.post(
  "/upload",
  protect,
  authorize("Super-Admin"),
  bikeUploadConfig.single("image"),
  handleMulterError,
  uploadSingleBike
);

// Multiple images upload (current implementation)
router.post(
  "/upload-multiple",
  protect,
  authorize("Super-Admin"),
  bikeUploadConfig.array("images", 10), // Max 10 images
  handleMulterError,
  uploadMultipleBikes
);

// Legacy add route (for backward compatibility) - can be removed later
router.post(
  "/add",
  protect,
  authorize("Super-Admin"),
  bikeUploadConfig.array("images", 10),
  handleMulterError,
  addBikes
);

router.patch(
  "/update/:id",
  protect,
  authorize("Super-Admin"),
  bikeUploadConfig.array("images", 10), // Max 10 images for updates
  handleMulterError,
  updateBikeById
);

router.delete("/del/:id", protect, authorize("Super-Admin"), deleteBikeById);

export default router;
