"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const seeder_1 = __importDefault(require("../AdminPrivilege/seeder"));
const authmiddleware_1 = require("../middleware/authmiddleware");
const branchM_controller_1 = require("../controllers/branchM.controller");
const router = express_1.default.Router();
// Seed route (development only)
if (process.env.NODE_ENV === "development") {
    router.post("/seed", seeder_1.default);
}
// ===== LOGIN ROUTES (PUBLIC - No auth needed) =====
router.post("/super-ad-login", auth_controller_1.loginSuperAdmin);
router.post("/branchM-login", branchM_controller_1.loginBranchM);
// ===== LOGOUT ROUTES (PROTECTED) =====
router.post("/super-ad-logout", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), auth_controller_1.logoutSuperAdmin);
router.post("/branchM-logout", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Branch-Admin"), branchM_controller_1.logoutBranchM);
// ===== BRANCH MANAGER MANAGEMENT (Super-Admin only) =====
router.post("/create-branchM", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), auth_controller_1.createBranchM);
router.get("/branch-managers", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), auth_controller_1.getAllBranchManagers);
router.delete("/del-branchM/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), auth_controller_1.deleteBranchM);
exports.default = router;
