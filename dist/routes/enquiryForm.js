"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/enquiry.routes.ts
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../middleware/authmiddleware");
const enquiry_controller_1 = require("../controllers/enquiry.controller");
const router = express_1.default.Router();
// Public routes
router.post("/", enquiry_controller_1.createEnquiry);
// Protected routes - Admin access required
router.get("/", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), enquiry_controller_1.getAllEnquiries);
router.get("/stats", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), enquiry_controller_1.getEnquiryStats);
router.get("/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), enquiry_controller_1.getEnquiryById);
// Super-Admin only routes
router.delete("/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), enquiry_controller_1.deleteEnquiry);
exports.default = router;
