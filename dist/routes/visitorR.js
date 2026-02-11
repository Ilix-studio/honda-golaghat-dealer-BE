"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const visitor_controller_1 = require("../controllers/visitor.controller");
const authmiddleware_1 = require("../middleware/authmiddleware");
const router = express_1.default.Router();
// Public routes - for visitor tracking
router.post("/increment-counter", visitor_controller_1.incrementVisitorCount);
router.get("/visitor-count", visitor_controller_1.getVisitorCount);
// Protected routes (Admin only) - for dashboard analytics
router.use(authmiddleware_1.protect);
// Admin dashboard analytics
router.get("/stats", visitor_controller_1.getVisitorStats);
router.post("/reset", visitor_controller_1.resetVisitorCount);
exports.default = router;
