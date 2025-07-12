import express from "express";
import {
  addBikes,
  deleteBikeById,
  getBikeById,
  getBikes,
  updateBikeById,
  uploadImages,
} from "../controllers/bikes.controller";
import { protect, authorize } from "../middleware/authmiddleware";

const router = express.Router();

// Public routes - GET requests with query parameters
router.get("/", getBikes);
router.get("/:id", getBikeById);

router.get("/search", getBikes);

// Protected routes - Admin only
router.post(
  "/addBikes",
  protect,
  authorize("Super-Admin"),
  uploadImages,
  addBikes
);
router.put(
  "put/:id",
  protect,
  authorize("Super-Admin"),
  uploadImages,
  updateBikeById
);
router.delete("del/:id", protect, authorize("Super-Admin"), deleteBikeById);

export default router;
