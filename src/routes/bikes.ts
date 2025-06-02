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
router.post("/getBikes", getBikes);
//
router.post("/getBike/:id", getBikeById);

//
router.post("/addBikes", protect, authorize("super-admin"), addBikes);

//
router.post(
  "/updateBike/:id",
  protect,
  authorize("super-admin"),
  updateBikeById
);
//
router.post("/getBikes", protect, authorize("super-admin"), deleteBikeById);

export default router;
