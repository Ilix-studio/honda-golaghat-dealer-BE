"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const customer_controller_1 = require("../../controllers/CustomerController/customer.controller");
const phoneNoCheck_controller_1 = require("../../controllers/CustomerController/phoneNoCheck.controller");
const phoneNoValidation_1 = require("../../middleware/phoneNoValidation");
const router = express_1.default.Router();
router.post("/save-auth-data", customer_controller_1.saveAuthData);
router.post("/check-phone", phoneNoValidation_1.validatePhoneCheck, phoneNoCheck_controller_1.checkPhoneNumber);
router.post("/check-phones-batch", phoneNoValidation_1.validateBatchPhoneCheck, phoneNoCheck_controller_1.checkPhoneNumbersBatch);
router.post("/login", customer_controller_1.loginCustomer);
// Add recovery System
exports.default = router;
