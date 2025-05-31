import express from "express";
import {
  addBikes,
  deleteBikeById,
  getBikeById,
  getBikes,
  updateBikeById,
} from "../controllers/bikes.controller";

const router = express.Router();

//
router.post("/addBikes", addBikes);

//
router.post("/getBikes", getBikes);
//
router.post("/getBike/:id", getBikeById);
//
router.post("/updateBike/:id", updateBikeById);
//
router.post("/getBikes", deleteBikeById);

export default router;
