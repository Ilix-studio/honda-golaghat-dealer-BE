"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const Admin_1 = __importDefault(require("../models/Admin"));
/**
 * @desc    Seed admin user
 * @route   POST /api/admin/seed
 * @access  Public (should be protected in production)
 */
const seedAdmin = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        // Check if admin already exists
        const existingAdmin = await Admin_1.default.findOne({
            email: "honda_golaghat@gmail.com",
        });
        if (!existingAdmin) {
            // Create admin user
            const admin = await Admin_1.default.create({
                name: "Honda-Golaghat",
                email: "honda_golaghat@gmail.com",
                password: "admin123",
                role: "Super-Admin",
            });
            // Return success response
            res.status(201).json({
                success: true,
                message: "Super-Admin user created successfully",
                data: {
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                },
            });
        }
        else {
            // Admin already exists
            res.status(200).json({
                success: true,
                message: "Super-Admin user already exists",
                data: {
                    name: existingAdmin.name,
                    email: existingAdmin.email,
                },
            });
        }
    }
    catch (error) {
        res.status(500);
        throw new Error(`Error seeding admin: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
});
exports.default = seedAdmin;
//Remove the branch from Admin mOdel to add super-Admin infomation in DB
