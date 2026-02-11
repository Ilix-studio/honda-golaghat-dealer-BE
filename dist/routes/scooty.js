"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scooty_controller_1 = require("../controllers/scooty.controller");
const authmiddleware_1 = require("../middleware/authmiddleware");
const router = express_1.default.Router();
/// api/scooty
// Public routes
router.get("/", scooty_controller_1.getScooty);
router.get("/:id", scooty_controller_1.getScootyById);
// Protected routes (admin only)
router.post("/add", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), scooty_controller_1.addScooty);
router.put("/put/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), scooty_controller_1.updateScootyById);
router.delete("/del/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), scooty_controller_1.deleteScootyById);
exports.default = router;
