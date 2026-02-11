"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/getapproved.ts
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../middleware/authmiddleware");
const getapproved_controller_1 = require("../controllers/getapproved.controller");
const router = express_1.default.Router();
// "/api/getapproved"
// Public routes - SPECIFIC ROUTES FIRST
router.post("/check-status", getapproved_controller_1.checkApplicationStatus);
router.post("/with-bike", getapproved_controller_1.submitApplicationWithBike);
router.post("/", getapproved_controller_1.submitApplication); // This must come after more specific POST routes
// Protected routes - SPECIFIC ROUTES FIRST
router.get("/stats", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), getapproved_controller_1.getApplicationStats);
router.get("/enquiry-stats", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), getapproved_controller_1.getEnquiryStats);
router.get("/with-bikes", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), getapproved_controller_1.getApplicationsWithBikes);
router.get("/all", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), getapproved_controller_1.getAllApplications);
// Branch-specific routes
router.get("/branch/:branchId", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), getapproved_controller_1.getApplicationsByBranch);
// Dynamic parameter routes - THESE MUST COME LAST
router.get("/:id", getapproved_controller_1.getApplicationById);
router.put("/:id/status", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), getapproved_controller_1.updateApplicationStatus);
router.put("/:id/bike-enquiry", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), getapproved_controller_1.updateBikeEnquiry);
router.get("/:id/bike-recommendations", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin")
// getBikeRecommendations
);
// Super-Admin only routes
router.delete("/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), getapproved_controller_1.deleteApplication);
exports.default = router;
