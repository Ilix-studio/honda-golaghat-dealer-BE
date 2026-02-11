"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
// Helper function to upload image to Cloudinary
const uploadToCloudinary = (buffer, originalName) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder: "honda-golaghat-dealer/bikes",
            public_id: `bike_${Date.now()}_${originalName.split(".")[0]}`,
            transformation: [
                { width: 800, height: 600, crop: "limit", quality: "auto" },
            ],
        }, (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(result.secure_url);
            }
        });
        uploadStream.end(buffer);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
// Helper function to delete image from Cloudinary
const deleteFromCloudinary = async (imageUrl) => {
    try {
        // Extract public_id from URL
        const urlParts = imageUrl.split("/");
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split(".")[0];
        const fullPublicId = `honda-golaghat-dealer/bikes/${publicId}`;
        await cloudinary_1.v2.uploader.destroy(fullPublicId);
    }
    catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
