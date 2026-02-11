"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bikes_controller_1 = require("../../controllers/BikeSystemController/bikes.controller");
const authmiddleware_1 = require("../../middleware/authmiddleware");
const router = express_1.default.Router();
// Public routes (no file uploads needed here)
router.get("/get", bikes_controller_1.getBikes);
router.get("/search", bikes_controller_1.searchBikes);
router.get("/category/:category", bikes_controller_1.getBikesByCategory);
router.get("/main-category/:mainCategory", bikes_controller_1.getBikesByMainCategory);
router.get("/fuel-norms/:fuelNorms", bikes_controller_1.getBikesByFuelNorms);
router.get("/e20-efficient", bikes_controller_1.getE20EfficientBikes);
router.get("/:id", bikes_controller_1.getBikeById);
// Protected routes (Super-Admin only) - NO FILE UPLOADS HERE
router.post("/create", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), bikes_controller_1.createBike);
router.patch("/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), bikes_controller_1.updateBike);
router.delete("/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), bikes_controller_1.deleteBike);
exports.default = router;
