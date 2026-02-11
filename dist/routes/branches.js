"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../middleware/authmiddleware");
const branches_controller_1 = require("../controllers/branches.controller");
const router = express_1.default.Router();
// "/api/branch"
// Public routes
router.get("/", branches_controller_1.getBranches);
router.get("/:id", branches_controller_1.getBranchById);
// Protected routes - Super-Admin only
router.post("/", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), branches_controller_1.addBranch);
router.patch("/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), branches_controller_1.updateBranch);
router.delete("/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), branches_controller_1.deleteBranch);
exports.default = router;
