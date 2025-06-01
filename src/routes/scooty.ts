import express from "express";
import {
  addScooty,
  deleteScootyById,
  getScootyById,
  getScooty,
  updateScootyById,
} from "../controllers/scooty.controller";

const router = express.Router();

//
router.post("/addScooty", addScooty);

//
router.post("/getScooty", getScooty);
//
router.post("/getScooty/:id", getScootyById);
//
router.post("/updateScooty/:id", updateScootyById);
//
router.post("/deleteScooty/:id", deleteScootyById);

export default router;
