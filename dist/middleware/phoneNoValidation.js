"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBatchPhoneCheck = exports.validatePhoneCheck = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const express_validator_2 = require("express-validator");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array().map((error) => ({
                field: error.type === "field" ? error.path : "unknown",
                message: error.msg,
                value: error.type === "field" ? error.value : undefined,
            })),
        });
        return;
    }
    next();
};
exports.validateRequest = validateRequest;
exports.validatePhoneCheck = [
    (0, express_validator_2.body)("phoneNumber")
        .notEmpty()
        .withMessage("Phone number is required")
        .matches(/^[6-9]\d{9}$/)
        .withMessage("Phone number must be 10 digits starting with 6-9"),
];
exports.validateBatchPhoneCheck = [
    (0, express_validator_2.body)("phoneNumbers")
        .isArray({ min: 1, max: 10 })
        .withMessage("Phone numbers must be an array with 1-10 items"),
    (0, express_validator_2.body)("phoneNumbers.*")
        .matches(/^[6-9]\d{9}$/)
        .withMessage("Each phone number must be 10 digits starting with 6-9"),
];
