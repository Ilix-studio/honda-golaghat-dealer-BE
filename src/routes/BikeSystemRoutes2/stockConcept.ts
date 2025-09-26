import express from "express";
import { authorize, protect } from "../../middleware/authmiddleware";
import {
  assignToCustomer,
  createStockItem,
  getAllStockItems,
  getStockItemById,
} from "../../controllers/BikeSystemController2/stockConcept.controller";

const router = express.Router();

// Create new stock item
router.post(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  createStockItem
);

// Get all stock items with filtering
router.get(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getAllStockItems
);

// Assign stock item to customer
router.patch(
  "/:id/assign",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  assignToCustomer
);

// Get stock item by ID
router.get(
  "/:id",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getStockItemById
);

export default router;
