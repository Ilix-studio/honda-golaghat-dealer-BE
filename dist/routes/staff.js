"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const authmiddleware_1 = require("../middleware/authmiddleware");
const staffM_controller_1 = require("../controllers/staffM.controller");
const router = express_1.default.Router();
// /api/staff
// Staff management routes - accessible by both roles
router.post("/create-staffM", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), auth_controller_1.createStaffM);
router.get("/:branchId", staffM_controller_1.getStaffByBranch);
router.put("/:branchId/:staffIndex", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), staffM_controller_1.updateStaffMember);
router.delete("/:branchId/:staffIndex", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), staffM_controller_1.removeStaffMember);
exports.default = router;
