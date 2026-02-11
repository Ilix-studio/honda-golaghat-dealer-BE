"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csvUploadConfig = exports.handleMulterError = exports.bikeUploadConfig = void 0;
const multer_1 = __importDefault(require("multer"));
// Enhanced file filter for multiple image types
const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        const allowedImageTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/bmp",
            "image/tiff",
            "image/svg+xml",
        ];
        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Image format ${file.mimetype} not supported. 
Supported formats: JPEG, PNG, WebP, GIF, BMP, TIFF, SVG`));
        }
    }
    else {
        cb(new Error("Only image files are allowed"));
    }
};
// Enhanced multer configuration for bike uploads
exports.bikeUploadConfig = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per image
        files: 10, // Maximum 10 images for bikes
    },
    fileFilter: imageFileFilter,
});
// Enhanced error handler for multer errors
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        switch (error.code) {
            case "LIMIT_FILE_SIZE":
                return res.status(400).json({
                    success: false,
                    message: "File size too large",
                    error: `Maximum file size allowed is ${error.field === "video" ? "500MB" : "10MB"}`,
                });
            case "LIMIT_FILE_COUNT":
                return res.status(400).json({
                    success: false,
                    message: "Too many files",
                    error: `Maximum ${req.route.path.includes("bike")
                        ? "10"
                        : req.route.path.includes("photo")
                            ? "10"
                            : req.route.path.includes("press")
                                ? "5"
                                : "2"} files allowed`,
                });
            case "LIMIT_UNEXPECTED_FILE":
                return res.status(400).json({
                    success: false,
                    message: "Unexpected field",
                    error: "Only allowed file fields are accepted",
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: "File upload error",
                    error: error.message,
                });
        }
    }
    // Handle custom file filter errors
    if (error.message.includes("not supported") ||
        error.message.includes("required") ||
        error.message.includes("Only")) {
        return res.status(400).json({
            success: false,
            message: "Invalid file type",
            error: error.message,
        });
    }
    // Pass other errors to the general error handler
    next(error);
};
exports.handleMulterError = handleMulterError;
exports.csvUploadConfig = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
            cb(null, true);
        }
        else {
            cb(new Error("Only CSV files allowed"));
        }
    },
});
