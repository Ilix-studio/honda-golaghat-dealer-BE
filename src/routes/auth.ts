import express from "express";

import { loginAdmin, logoutAdmin } from "../controllers/auth.controller";

const router = express.Router();

// login admin
router.post("/login", loginAdmin);

// Institute logout
router.post("/logout", logoutAdmin);

export default router;
