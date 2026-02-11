"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../../middleware/authmiddleware");
const customerVehicle_controller_1 = require("../../controllers/BikeSystemController2/customerVehicle.controller");
const customerMiddleware_1 = require("../../middleware/customerMiddleware");
const router = express_1.default.Router();
router.get("/my-vehicles", customerMiddleware_1.protectCustomer, customerVehicle_controller_1.getMyVehicles);
router.get("/:id", customerMiddleware_1.protectAdminOrCustomer, customerVehicle_controller_1.getVehicleById);
// Vehicle CRUD operations
router.get("/", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), customerVehicle_controller_1.getAllCustomerVehicles //Super-Admin Dashboard
);
router.post("/", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), customerVehicle_controller_1.createVehicleFromStock);
router.put("/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), customerVehicle_controller_1.updateVehicle);
router.delete("/:id", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), customerVehicle_controller_1.deleteVehicle);
// Service management
router.put("/:id/service-status", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), customerVehicle_controller_1.updateServiceStatus);
router.get("/admin/service-due", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), customerVehicle_controller_1.getServiceDueVehicles);
// Statistics and reporting
router.get("/admin/stats", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), customerVehicle_controller_1.getVehicleStats);
// Vehicle ownership transfer
router.put("/:id/transfer", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), customerVehicle_controller_1.transferVehicle);
exports.default = router;
