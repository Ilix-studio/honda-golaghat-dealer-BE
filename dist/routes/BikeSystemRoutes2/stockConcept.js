"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../../middleware/authmiddleware");
const stockConcept_controller_1 = require("../../controllers/BikeSystemController2/stockConcept.controller");
const StockAssign_1 = require("../../controllers/BikeSystemController2/AssignToCustomer/StockAssign");
const customerMiddleware_1 = require("../../middleware/customerMiddleware");
const router = express_1.default.Router();
router.get("/my-vehicles", customerMiddleware_1.protectCustomer, stockConcept_controller_1.getMyVehicles); // Customer-Dashboard
router.get("/:id", customerMiddleware_1.protectAdminOrCustomer, stockConcept_controller_1.getVehicleById); // Customer-Dashboard
// Create new stock item
router.post("/", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), stockConcept_controller_1.createStockItem);
// Get all stock items with filtering
router.get("/", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), stockConcept_controller_1.getAllStockItems);
// Assign stock item to customer
router.post("/:id/activate", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), StockAssign_1.activateToCustomer);
// Get stock item by ID
router.get("/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), stockConcept_controller_1.getStockItemById);
exports.default = router;
