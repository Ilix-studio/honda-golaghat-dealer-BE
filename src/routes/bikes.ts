import express from "express";
import {
  addBikes,
  deleteBikeById,
  getBikeById,
  getBikes,
  updateBikeById,
} from "../controllers/bikes.controller";
import { protect, authorize } from "../middleware/authmiddleware";

const router = express.Router();

// Public routes - GET requests with query parameters
router.get("/", getBikes);
router.get("/:id", getBikeById);

router.post("/search", getBikes);

// Protected routes - Admin only
router.post("/addBikes", protect, authorize("Super-Admin"), addBikes);
router.put("/:id", protect, authorize("Super-Admin"), updateBikeById);
router.delete("/:id", protect, authorize("Super-Admin"), deleteBikeById);

export default router;
