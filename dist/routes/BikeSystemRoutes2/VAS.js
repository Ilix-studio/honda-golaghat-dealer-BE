"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const vas_controller_1 = require("../../controllers/BikeSystemController2/vas.controller");
const authmiddleware_1 = require("../../middleware/authmiddleware");
const customerMiddleware_1 = require("../../middleware/customerMiddleware");
const vasAssign_1 = require("../../controllers/BikeSystemController2/AssignToCustomer/vasAssign");
const router = express_1.default.Router();
// "/api/value-added-services"
// ===== ADMIN ROUTES =====
router.post("/", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), vas_controller_1.createValueAddedService);
router.get("/admin", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), vas_controller_1.getAllValueAddedServices);
router.get("/admin/customers", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), vas_controller_1.getCustomersWithActiveVAS);
router.get("/admin/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), vas_controller_1.getValueAddedServiceById);
router.patch("/admin/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), vas_controller_1.updateValueAddedService);
router.delete("/admin/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), vas_controller_1.deleteValueAddedService);
// Customer service activation
router.post("/activate", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), vasAssign_1.activateCustomerService);
// ===== CUSTOMER ROUTES =====
router.get("/my-services", customerMiddleware_1.protectCustomer, vas_controller_1.getCustomerActiveServices);
router.post("/calculate-price", customerMiddleware_1.protectCustomer, vas_controller_1.calculateServicePrice);
// ===== PUBLIC/MIXED ROUTES =====
router.get("/types/:serviceType", vas_controller_1.getServicesByType);
exports.default = router;
