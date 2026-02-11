"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const customerMiddleware_1 = require("../../middleware/customerMiddleware");
const authmiddleware_1 = require("../../middleware/authmiddleware");
const profile_controller_1 = require("../../controllers/CustomerController/profile.controller");
const router = express_1.default.Router();
// ===== CUSTOMER ROUTES (Customer authentication required) =====
router.post("/create", customerMiddleware_1.protectCustomer, profile_controller_1.createProfile);
router.get("/get", customerMiddleware_1.protectCustomer, profile_controller_1.getCustomerProfile); // For dashboard
router.patch("/update", customerMiddleware_1.protectCustomer, profile_controller_1.updateCustomerProfile); //UpdateRequest
// Customer can access their own data
router.get("/:customerId", customerMiddleware_1.protectAdminOrCustomer, profile_controller_1.getCustomerById);
// ===== ADMIN ROUTES (Admin authentication required) =====
router.get("/", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), profile_controller_1.getAllCustomers);
router.delete("/:customerId", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"));
exports.default = router;
