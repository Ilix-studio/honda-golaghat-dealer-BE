"use strict";
// routes/BikeSystemModel2/csvStock.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authmiddleware_1 = require("../../middleware/authmiddleware");
const multerConfig_1 = require("../../config/multerConfig");
const csvStockImport_controller_1 = require("../../controllers/BikeSystemController3/csvStockImport.controller");
const router = express_1.default.Router();
router.post("/import", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), multerConfig_1.csvUploadConfig.single("file"), multerConfig_1.handleMulterError, csvStockImport_controller_1.importCSVStock);
router.get("/", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), csvStockImport_controller_1.getCSVStocks);
//
router.post("/assign/:stockId", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), csvStockImport_controller_1.assignCSVStockToCustomer);
//
router.get("/:stockId", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), csvStockImport_controller_1.getCSVStockByStockId);
// Get CSV import batches
router.get("/batches/list", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), csvStockImport_controller_1.getCSVBatches);
// Get stocks by batch ID
router.get("/batch/:batchId", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), csvStockImport_controller_1.getStocksByBatch);
// Update CSV stock status
router.patch("/:stockId/status", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin", "Branch-Admin"), csvStockImport_controller_1.updateCSVStockStatus);
router.post("/unassign/:stockId", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), csvStockImport_controller_1.unassignCSVStock);
// Delete CSV stock (soft delete)
router.delete("/:stockId", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), csvStockImport_controller_1.deleteCSVStock);
exports.default = router;
