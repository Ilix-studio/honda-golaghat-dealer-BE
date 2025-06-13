import express from "express";
import { authorize, protect } from "../middleware/authmiddleware";
import {
  submitApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  getApplicationStats,
  getApplicationsByBranch,
  checkApplicationStatus,

  // NEW: Enhanced methods for bike enquiries
  submitApplicationWithBike,
  getApplicationsWithBikes,
  updateBikeEnquiry,
  getBikeRecommendations,
  getEnquiryStats,
} from "../controllers/getapproved.controller";

const router = express.Router();
// "/api/getapproved"

// Public routes
router.post("/", submitApplication);
router.get("/:id", getApplicationById); // Can be accessed with application ID
router.post("/check-status", checkApplicationStatus);
router.post("/with-bike", submitApplicationWithBike);

// Protected routes - Admin only
router.get(
  "/",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getAllApplications
);

router.put(
  "/:id/status",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  updateApplicationStatus
);
router.get(
  "/with-bikes",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getApplicationsWithBikes
);

router.get(
  "/stats",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getApplicationStats
);

// Branch-specific routes
router.get(
  "/branch/:branchId",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getApplicationsByBranch
);

router.put(
  "/:id/bike-enquiry",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  updateBikeEnquiry
);

// Super-Admin only routes
router.delete("/:id", protect, authorize("Super-Admin"), deleteApplication);

router.get(
  "/:id/bike-recommendations",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getBikeRecommendations
);

router.get(
  "/enquiry-stats",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  getEnquiryStats
);

export default router;
