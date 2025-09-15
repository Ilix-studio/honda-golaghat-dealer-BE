import express from "express";
import {
  addBikes,
  deleteBikeById,
  getBikeById,
  getBikes,
  updateBikeById,
  getBikesByCategory,
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
router.get("/:id", getBikeById);

// Protected routes (Super-Admin only)
router.post(
  "/add",
  protect,
  authorize("Super-Admin"),
  bikeUploadConfig.array("images", 10), // Max 10 images
  handleMulterError,
  addBikes
);

router.put(
  "/put/:id",
  protect,
  authorize("Super-Admin"),
  bikeUploadConfig.array("images", 10), // Max 10 images for updates
  handleMulterError,
  updateBikeById
);

router.delete("/del/:id", protect, authorize("Super-Admin"), deleteBikeById);

export default router;
