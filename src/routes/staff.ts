import express from "express";

import { createStaffM } from "../controllers/auth.controller";

import { authorize, protect } from "../middleware/authmiddleware";
import {
  getStaffByBranch,
  removeStaffMember,
  updateStaffMember,
} from "../controllers/staffM.controller";

const router = express.Router();

// /api/staff

// Staff management routes - accessible by both roles
router.post(
  "/create-staffM",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  createStaffM
);
router.get("/:branchId", getStaffByBranch);
router.put(
  "/:branchId/:staffIndex",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  updateStaffMember
);
router.delete(
  "/:branchId/:staffIndex",
  protect,
  authorize("Super-Admin", "Branch-Admin"),
  removeStaffMember
);

export default router;
