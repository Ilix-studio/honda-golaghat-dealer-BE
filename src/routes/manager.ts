import express from "express";
import {
  generateBranchManagerCredentials,
  getBranchManagers,
  getBranchManager,
  updateBranchManager,
  deleteBranchManager,
  regenerateBranchManagerPassword,
} from "../controllers/branchManager.controller";
import { protect, authorize } from "../middleware/authmiddleware";

const router = express.Router();

// Protect all routes
router.use(protect);
// Only super-admin can access these routes
router.use(authorize("super-admin"));

router.route("/").get(getBranchManagers).post(generateBranchManagerCredentials);

router
  .route("/:id")
  .get(getBranchManager)
  .put(updateBranchManager)
  .delete(deleteBranchManager);

router.post("/:id/regenerate-password", regenerateBranchManagerPassword);

export default router;
