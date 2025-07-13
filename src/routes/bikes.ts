import express from "express";
import {
  addBikes,
  deleteBikeById,
  getAllBikesForComparison,
  getBikeById,
  getBikeByIdForComparison,
  getBikes,
  updateBikeById,
  uploadImages,
} from "../controllers/bikes.controller";
import { protect, authorize } from "../middleware/authmiddleware";

const router = express.Router();

// Protected routes - Admin only
router.post(
  "/addBikes",
  protect,
  authorize("Super-Admin"),
  uploadImages,
  addBikes
);

router.get("/search", getBikes);

// Public routes - GET requests with query parameters
router.get("/", getBikes);
router.get("/:id", getBikeById);

router.put(
  "put/:id",
  protect,
  authorize("Super-Admin"),
  uploadImages,
  updateBikeById
);
router.delete("del/:id", protect, authorize("Super-Admin"), deleteBikeById);

router.get("/getallbikes", getAllBikesForComparison);
router.get("/bikeId/:id", getBikeByIdForComparison);

export default router;
