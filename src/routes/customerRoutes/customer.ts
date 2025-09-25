import express from "express";

import {
  saveAuthData,
  loginCustomer,
} from "../../controllers/CustomerController/customer.controller";

const router = express.Router();

router.post("/save-auth-data", saveAuthData);
router.post("/login", loginCustomer);

// Add recovery System

export default router;
