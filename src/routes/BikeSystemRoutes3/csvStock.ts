// routes/BikeSystemModel2/csvStock.ts

import express from "express";
import { protect, authorize } from "../../middleware/authmiddleware";

import { csvUploadConfig, handleMulterError } from "../../config/multerConfig";
import {
  assignCSVStockToCustomer,
  getCSVStocks,
  importCSVStock,
} from "../../controllers/BikeSystemController3/csvStockImport.controller";

const router = express.Router();

router.post(
  "/import",
  protect,
  authorize("Super-Admin"),
  csvUploadConfig.single("file"),
  handleMulterError,
  importCSVStock
);

router.get(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getCSVStocks
);

router.post(
  "/assign/:stockId",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  assignCSVStockToCustomer
);

export default router;
