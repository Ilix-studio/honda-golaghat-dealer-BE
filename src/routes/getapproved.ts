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
} from "../controllers/getapproved.controller";

const router = express.Router();
// "/api/getapproved"

// Public routes
router.post("/", submitApplication);
router.get("/:id", getApplicationById); // Can be accessed with application ID
router.post("/check-status", checkApplicationStatus);

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

// Super-Admin only routes
router.delete("/:id", protect, authorize("Super-Admin"), deleteApplication);

export default router;
