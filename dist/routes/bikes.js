"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bikes_controller_1 = require("../controllers/bikes.controller");
const authmiddleware_1 = require("../middleware/authmiddleware");
const router = express_1.default.Router();
// Public routes - GET requests with query parameters
router.get("/", bikes_controller_1.getBikes);
router.get("/:id", bikes_controller_1.getBikeById);
router.post("/search", bikes_controller_1.getBikes);
// Protected routes - Admin only
router.post("/addBikes", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), bikes_controller_1.addBikes);
router.put("/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), bikes_controller_1.updateBikeById);
router.delete("/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), bikes_controller_1.deleteBikeById);
exports.default = router;
