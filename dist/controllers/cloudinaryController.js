"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCloudinaryImage = exports.generateSignature = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const cloudinaryConfig_1 = __importDefault(require("../config/cloudinaryConfig"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Generate a signature for authenticated Cloudinary uploads
 * @route POST /api/cloudinary/signature
 * @access Private (Admin only)
 */
exports.generateSignature = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { folder = "honda-golaghat-dealer" } = req.body;
        // Check if Cloudinary env variables are properly set
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        if (!cloudName || !apiKey || !apiSecret) {
            res.status(500).json({
                success: false,
                message: "Cloudinary configuration is missing on the server",
            });
            return; // Return without the response object
        }
        // Create timestamp for the signature
        const timestamp = Math.round(new Date().getTime() / 1000);
        // Create the signature
        const signature = cloudinaryConfig_1.default.utils.api_sign_request({ timestamp, folder }, apiSecret);
        // Return signature data to the client
        res.status(200).json({
            timestamp,
            signature,
            cloudName,
            apiKey,
            folder,
        });
    }
    catch (error) {
        logger_1.default.error(`Error generating Cloudinary signature: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error generating upload signature",
            error: error.message,
        });
    }
});
/**
 * Delete an image from Cloudinary
 * @route DELETE /api/cloudinary/:publicId
 * @access Private (Admin only)
 */
exports.deleteCloudinaryImage = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { publicId } = req.params;
        if (!publicId) {
            res.status(400);
            throw new Error("Public ID is required");
        }
        // Delete the image from Cloudinary
        const result = await cloudinaryConfig_1.default.uploader.destroy(publicId);
        if (result.result !== "ok") {
            res.status(400);
            throw new Error(`Failed to delete image: ${result.result}`);
        }
        res.status(200).json({
            success: true,
            message: "Image deleted successfully",
        });
    }
    catch (error) {
        logger_1.default.error(`Error deleting Cloudinary image: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error deleting image",
            error: error.message,
        });
    }
});
