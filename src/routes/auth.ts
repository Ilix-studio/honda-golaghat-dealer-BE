import express from "express";

import {
  loginSuperAdmin,
  logoutSuperAdmin,
  createBranchM,
  loginBranchM,
  logoutBranchM,
  deleteBranchM,
  createStaffM,
} from "../controllers/auth.controller";
import seedAdmin from "../AdminPrivilege/seeder";
import { authorize, protect } from "../middleware/authmiddleware";
import {
  getStaffByBranch,
  removeStaffMember,
  updateStaffMember,
} from "../controllers/staffM.controller";

const router = express.Router();

if (process.env.NODE_ENV === "development") {
  router.post("/seed", seedAdmin);
}

// Protect all routes
router.use(protect);

// login Super-Admin
router.post("/super-ad-login", authorize("Super-Admin"), loginSuperAdmin);

// logout Super-Admin
router.post("/super-ad-logout", authorize("Super-Admin"), logoutSuperAdmin);

// create Branch-Manager by super-admin
router.post("/create-branchM", authorize("Super-Admin"), createBranchM);

// login Branch-Manager
router.post("/branchM-login", authorize("Branch-Admin"), loginBranchM);

// logout Branch-Manager
router.post("/branchM-logout", authorize("Branch-Admin"), logoutBranchM);

// delete branch-Manager
router.delete("/del-branchM", authorize("Super-Admin"), deleteBranchM);

// Staff management routes - accessible by both roles
router.post(
  "/create-staffM",
  authorize("Super-Admin", "Branch-Admin"),
  createStaffM
);
router.get(
  "/staff/:branchId",
  authorize("Super-Admin", "Branch-Admin"),
  getStaffByBranch
);
router.put(
  "/staff/:branchId/:staffIndex",
  authorize("Super-Admin", "Branch-Admin"),
  updateStaffMember
);
router.delete(
  "/staff/:branchId/:staffIndex",
  authorize("Super-Admin", "Branch-Admin"),
  removeStaffMember
);

export default router;
