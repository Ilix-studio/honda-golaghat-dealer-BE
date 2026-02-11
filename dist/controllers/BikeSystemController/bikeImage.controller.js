"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingleBikeImage = exports.setPrimaryImage = exports.deleteAllBikeImages = exports.deleteBikeImage = exports.updateBikeImage = exports.getBikeImages = exports.uploadBikeImages = void 0;
// controllers/bikeImage.controller.ts
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const cloudinary_1 = require("cloudinary");
const Bikes_1 = __importDefault(require("../../models/BikeSystemModel/Bikes"));
const BikeImageModel_1 = __importDefault(require("../../models/BikeSystemModel/BikeImageModel"));
const cloudinaryHelper_1 = require("../../utils/cloudinaryHelper");
/**
 * @desc    Upload images for a bike
 * @route   POST /api/bike-images/:bikeId
 * @access  Private/Super-Admin
 */
exports.uploadBikeImages = (0, express_async_handler_1.default)(async (req, res) => {
    const { bikeId } = req.params;
    const { altTexts } = req.body;
    // Validate bike exists
    const bike = await Bikes_1.default.findById(bikeId);
    if (!bike) {
        res.status(404);
        throw new Error("Bike not found");
    }
    // Check if files are uploaded
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
            success: false,
            error: "At least one image is required",
        });
        return;
    }
    const files = req.files;
    try {
        // Parse altTexts
        let altTextsArray = [];
        if (typeof altTexts === "string") {
            try {
                altTextsArray = JSON.parse(altTexts);
            }
            catch (error) {
                altTextsArray = [altTexts];
            }
        }
        else if (Array.isArray(altTexts)) {
            altTextsArray = altTexts;
        }
        // Check if this is the first image for this bike
        const existingImages = await BikeImageModel_1.default.find({
            bikeId,
            isActive: true,
        });
        const isFirstImage = existingImages.length === 0;
        // Upload all images to Cloudinary
        const uploadPromises = files.map((file, index) => {
            return new Promise((resolve, reject) => {
                cloudinary_1.v2.uploader
                    .upload_stream({
                    folder: `honda-golaghat-dealer/${bike.mainCategory}s`,
                    resource_type: "image",
                    quality: "auto",
                    format: "jpg",
                    transformation: [
                        { width: 800, height: 600, crop: "fill" },
                        { quality: "auto" },
                    ],
                }, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve({
                            src: result.secure_url,
                            alt: altTextsArray[index] ||
                                `${bike.modelName} - Image ${existingImages.length + index + 1}`,
                            cloudinaryPublicId: result.public_id,
                            isPrimary: isFirstImage && index === 0, // First image is primary only if no existing images
                        });
                })
                    .end(file.buffer);
            });
        });
        const uploadedImageData = await Promise.all(uploadPromises);
        // Create image documents
        const imageDocuments = uploadedImageData.map((imageData) => ({
            bikeId,
            ...imageData,
        }));
        const savedImages = await BikeImageModel_1.default.insertMany(imageDocuments);
        res.status(201).json({
            success: true,
            message: `${uploadedImageData.length} image(s) uploaded successfully for ${bike.modelName}`,
            data: {
                bikeId,
                uploadedCount: savedImages.length,
                images: savedImages,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || "Failed to upload images",
        });
    }
});
/**
 * @desc    Get all images for a bike
 * @route   GET /api/bike-images/:bikeId
 * @access  Public
 */
exports.getBikeImages = (0, express_async_handler_1.default)(async (req, res) => {
    const { bikeId } = req.params;
    // Validate bike exists
    const bike = await Bikes_1.default.findById(bikeId);
    if (!bike) {
        res.status(404);
        throw new Error("Bike not found");
    }
    const images = await BikeImageModel_1.default.find({
        bikeId,
        isActive: true,
    })
        .sort({ isPrimary: -1, createdAt: 1 })
        .lean();
    res.status(200).json({
        success: true,
        data: {
            bikeId,
            bike: {
                modelName: bike.modelName,
                mainCategory: bike.mainCategory,
            },
            images,
            count: images.length,
        },
    });
});
/**
 * @desc    Update image details (alt text, set as primary)
 * @route   PUT /api/bike-images/image/:imageId
 * @access  Private/Super-Admin
 */
exports.updateBikeImage = (0, express_async_handler_1.default)(async (req, res) => {
    const { imageId } = req.params;
    const { alt, isPrimary } = req.body;
    const image = await BikeImageModel_1.default.findById(imageId);
    if (!image) {
        res.status(404);
        throw new Error("Image not found");
    }
    // If setting as primary, unset other primary images for this bike
    if (isPrimary === true) {
        await BikeImageModel_1.default.updateMany({ bikeId: image.bikeId, _id: { $ne: imageId } }, { isPrimary: false });
    }
    // Update image
    if (alt !== undefined)
        image.alt = alt;
    if (isPrimary !== undefined)
        image.isPrimary = isPrimary;
    const updatedImage = await image.save();
    res.status(200).json({
        success: true,
        message: "Image updated successfully",
        data: updatedImage,
    });
});
/**
 * @desc    Delete a specific bike image
 * @route   DELETE /api/bike-images/image/:imageId
 * @access  Private/Super-Admin
 */
exports.deleteBikeImage = (0, express_async_handler_1.default)(async (req, res) => {
    const { imageId } = req.params;
    const image = await BikeImageModel_1.default.findById(imageId);
    if (!image) {
        res.status(404);
        throw new Error("Image not found");
    }
    try {
        // Delete from Cloudinary
        await (0, cloudinaryHelper_1.deleteFromCloudinary)(image.src);
        // Delete from database
        await BikeImageModel_1.default.findByIdAndDelete(imageId);
        // If this was the primary image, set another image as primary
        if (image.isPrimary) {
            const nextImage = await BikeImageModel_1.default.findOne({
                bikeId: image.bikeId,
                isActive: true,
            }).sort({ createdAt: 1 });
            if (nextImage) {
                nextImage.isPrimary = true;
                await nextImage.save();
            }
        }
        res.status(200).json({
            success: true,
            message: "Image deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || "Failed to delete image",
        });
    }
});
/**
 * @desc    Delete all images for a bike
 * @route   DELETE /api/bike-images/:bikeId
 * @access  Private/Super-Admin
 */
exports.deleteAllBikeImages = (0, express_async_handler_1.default)(async (req, res) => {
    const { bikeId } = req.params;
    const bike = await Bikes_1.default.findById(bikeId);
    if (!bike) {
        res.status(404);
        throw new Error("Bike not found");
    }
    const images = await BikeImageModel_1.default.find({ bikeId, isActive: true });
    if (images.length === 0) {
        res.status(400).json({
            success: false,
            error: "No images found for this bike",
        });
        return;
    }
    try {
        // Delete all images from Cloudinary
        const deletePromises = images.map((image) => (0, cloudinaryHelper_1.deleteFromCloudinary)(image.src));
        await Promise.all(deletePromises);
        // Delete from database
        await BikeImageModel_1.default.deleteMany({ bikeId });
        res.status(200).json({
            success: true,
            message: `${images.length} images deleted successfully for ${bike.modelName}`,
            deletedCount: images.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || "Failed to delete images",
        });
    }
});
/**
 * @desc    Set primary image for a bike
 * @route   PUT /api/bike-images/:bikeId/primary/:imageId
 * @access  Private/Super-Admin
 */
exports.setPrimaryImage = (0, express_async_handler_1.default)(async (req, res) => {
    const { bikeId, imageId } = req.params;
    const bike = await Bikes_1.default.findById(bikeId);
    if (!bike) {
        res.status(404);
        throw new Error("Bike not found");
    }
    const image = await BikeImageModel_1.default.findOne({
        _id: imageId,
        bikeId,
        isActive: true,
    });
    if (!image) {
        res.status(404);
        throw new Error("Image not found for this bike");
    }
    // Unset all primary images for this bike
    await BikeImageModel_1.default.updateMany({ bikeId }, { isPrimary: false });
    // Set this image as primary
    image.isPrimary = true;
    await image.save();
    res.status(200).json({
        success: true,
        message: "Primary image updated successfully",
        data: image,
    });
});
/**
 * @desc    Upload single image for a bike
 * @route   POST /api/bike-images/:bikeId/single
 * @access  Private/Super-Admin
 */
exports.uploadSingleBikeImage = (0, express_async_handler_1.default)(async (req, res) => {
    const { bikeId } = req.params;
    const { alt } = req.body;
    // Validate bike exists
    const bike = await Bikes_1.default.findById(bikeId);
    if (!bike) {
        res.status(404);
        throw new Error("Bike not found");
    }
    // Check if file is uploaded
    const imageFile = req.file;
    if (!imageFile) {
        res.status(400).json({
            success: false,
            error: "Image file is required",
        });
        return;
    }
    try {
        // Check if this is the first image for this bike
        const existingImagesCount = await BikeImageModel_1.default.countDocuments({
            bikeId,
            isActive: true,
        });
        const isFirstImage = existingImagesCount === 0;
        // Upload image to Cloudinary
        const imageUploadResult = await new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader
                .upload_stream({
                folder: `honda-golaghat-dealer/${bike.mainCategory}s`,
                resource_type: "image",
                quality: "auto",
                format: "jpg",
                transformation: [
                    { width: 800, height: 600, crop: "fill" },
                    { quality: "auto" },
                ],
            }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            })
                .end(imageFile.buffer);
        });
        const imageResult = imageUploadResult;
        // Create image document
        const savedImage = await BikeImageModel_1.default.create({
            bikeId,
            src: imageResult.secure_url,
            alt: alt || `${bike.modelName} - Image ${existingImagesCount + 1}`,
            cloudinaryPublicId: imageResult.public_id,
            isPrimary: isFirstImage, // First image is automatically primary
        });
        res.status(201).json({
            success: true,
            message: `Image uploaded successfully for ${bike.modelName}`,
            data: {
                bikeId,
                image: savedImage,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || "Failed to upload image",
        });
    }
});
