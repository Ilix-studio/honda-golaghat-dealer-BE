"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bikeImage_controller_1 = require("../../controllers/BikeSystemController/bikeImage.controller");
const authmiddleware_1 = require("../../middleware/authmiddleware");
const multerConfig_1 = require("../../config/multerConfig");
const router = express_1.default.Router();
// Public routes
router.get("/:bikeId", bikeImage_controller_1.getBikeImages);
// Protected routes (Super-Admin only) - FILE UPLOADS HERE
router.post("/:bikeId", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), multerConfig_1.bikeUploadConfig.array("images", 10), // Max 10 images
multerConfig_1.handleMulterError, bikeImage_controller_1.uploadBikeImages);
router.post("/:bikeId/single", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), multerConfig_1.bikeUploadConfig.single("image"), multerConfig_1.handleMulterError, bikeImage_controller_1.uploadSingleBikeImage);
// Image management routes
router.patch("/image/:imageId", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), bikeImage_controller_1.updateBikeImage);
router.delete("/image/:imageId", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), bikeImage_controller_1.deleteBikeImage);
router.delete("/:bikeId", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), bikeImage_controller_1.deleteAllBikeImages);
router.put("/:bikeId/primary/:imageId", authmiddleware_1.protect, (0, authmiddleware_1.authorize)("Super-Admin"), bikeImage_controller_1.setPrimaryImage);
exports.default = router;
