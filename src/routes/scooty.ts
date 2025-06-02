import express from "express";
import {
  addScooty,
  deleteScootyById,
  getScootyById,
  getScooty,
  updateScootyById,
} from "../controllers/scooty.controller";
import { protect, authorize } from "../middleware/authmiddleware";

const router = express.Router();

// Public routes
router.get("/", getScooty);
router.get("/:id", getScootyById);

// Protected routes (admin only)
router.post("/add", protect, authorize("super-admin"), addScooty);
router.put("/put/:id", protect, authorize("super-admin"), updateScootyById);
router.delete("/del/:id", protect, authorize("super-admin"), deleteScootyById);

export default router;
