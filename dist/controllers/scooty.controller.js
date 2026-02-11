"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteScootyById = exports.updateScootyById = exports.getScootyById = exports.getScooty = exports.addScooty = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Scooty_1 = __importDefault(require("../models/Scooty"));
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * @desc    Add a new scooty
 * @route   POST /api/scooty
 * @access  Private
 */
exports.addScooty = (0, express_async_handler_1.default)(async (req, res) => {
    const { modelName, category, year, price, engine, power, features, colors, images, inStock, quantity, branch, } = req.body;
    // Validate required fields
    if (!modelName ||
        !category ||
        !year ||
        !price ||
        !engine ||
        !power ||
        !branch) {
        res.status(400);
        throw new Error("Please provide all required fields");
    }
    // Validate category is one of the allowed values
    const validCategories = [
        "sport",
        "adventure",
        "cruiser",
        "touring",
        "naked",
        "scooter",
    ];
    if (!validCategories.includes(category)) {
        res.status(400);
        throw new Error("Invalid category");
    }
    // Validate branch is a valid ObjectId
    if (!mongoose_1.default.Types.ObjectId.isValid(branch)) {
        res.status(400);
        throw new Error("Invalid branch ID");
    }
    const newScooty = await Scooty_1.default.create({
        modelName,
        category,
        year,
        price,
        engine,
        power,
        features: features || [],
        colors: colors || [],
        images: images || [],
        inStock: inStock !== undefined ? inStock : true,
        quantity: quantity || 0,
        branch,
    });
    res.status(201).json({
        success: true,
        data: newScooty,
        message: "Scooty added successfully",
    });
});
/**
 * @desc    Get all scooties with optional filtering
 * @route   GET /api/scooty
 * @access  Public
 */
exports.getScooty = (0, express_async_handler_1.default)(async (req, res) => {
    const { category, minPrice, maxPrice, inStock, branch, search, sortBy, limit = 10, page = 1, } = req.query;
    // Build query
    const query = {};
    // Add filters if provided
    if (category) {
        query.category = category;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined)
            query.price.$gte = Number(minPrice);
        if (maxPrice !== undefined)
            query.price.$lte = Number(maxPrice);
    }
    if (inStock !== undefined) {
        query.inStock = inStock === "true";
    }
    if (branch) {
        if (!mongoose_1.default.Types.ObjectId.isValid(branch)) {
            res.status(400);
            throw new Error("Invalid branch ID");
        }
        query.branch = branch;
    }
    // Add search functionality
    if (search) {
        query.$or = [
            { modelName: { $regex: search, $options: "i" } },
            { features: { $in: [new RegExp(String(search), "i")] } },
        ];
    }
    // Calculate pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    // Determine sort order
    let sort = {};
    switch (sortBy) {
        case "price-low":
            sort = { price: 1 };
            break;
        case "price-high":
            sort = { price: -1 };
            break;
        case "newest":
            sort = { year: -1 };
            break;
        default:
            sort = { createdAt: -1 }; // Default to newest added
    }
    // Get total count for pagination
    const total = await Scooty_1.default.countDocuments(query);
    // Execute query with pagination and sorting
    const scooties = await Scooty_1.default.find(query)
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .populate("branch", "name location");
    res.status(200).json({
        success: true,
        count: scooties.length,
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        data: scooties,
    });
});
/**
 * @desc    Get a single scooty by ID
 * @route   GET /api/scooty/:id
 * @access  Public
 */
exports.getScootyById = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid scooty ID");
    }
    const scooty = await Scooty_1.default.findById(id).populate("branch", "name location");
    if (!scooty) {
        res.status(404);
        throw new Error("Scooty not found");
    }
    res.status(200).json({
        success: true,
        data: scooty,
    });
});
/**
 * @desc    Update a scooty by ID
 * @route   PUT /api/scooty/:id
 * @access  Private
 */
exports.updateScootyById = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid scooty ID");
    }
    // Validate category if provided
    if (updateData.category) {
        const validCategories = [
            "sport",
            "adventure",
            "cruiser",
            "touring",
            "naked",
            "scooter",
        ];
        if (!validCategories.includes(updateData.category)) {
            res.status(400);
            throw new Error("Invalid category");
        }
    }
    // Validate branch if provided
    if (updateData.branch &&
        !mongoose_1.default.Types.ObjectId.isValid(updateData.branch)) {
        res.status(400);
        throw new Error("Invalid branch ID");
    }
    const updatedScooty = await Scooty_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    if (!updatedScooty) {
        res.status(404);
        throw new Error("Scooty not found");
    }
    res.status(200).json({
        success: true,
        data: updatedScooty,
        message: "Scooty updated successfully",
    });
});
/**
 * @desc    Delete a scooty by ID
 * @route   DELETE /api/scooty/:id
 * @access  Private
 */
exports.deleteScootyById = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid scooty ID");
    }
    const scooty = await Scooty_1.default.findByIdAndDelete(id);
    if (!scooty) {
        res.status(404);
        throw new Error("Scooty not found");
    }
    res.status(200).json({
        success: true,
        message: "Scooty deleted successfully",
    });
});
