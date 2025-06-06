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

//
router.get("/getBikes", getBikes);
//
router.get("/getBike/:id", getBikeById);

//
router.post("/addBikes", protect, authorize("Super-Admin"), addBikes);

//
router.post(
  "/updateBike/:id",
  protect,
  authorize("Super-Admin"),
  updateBikeById
);
//
router.post("/getBikes", protect, authorize("Super-Admin"), deleteBikeById);

export default router;
