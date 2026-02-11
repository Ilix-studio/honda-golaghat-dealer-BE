"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomPassword = exports.generateApplicationId = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates a random application ID for branch managers
 * Format: BM-XXXX-XXXX (where X is alphanumeric)
 */
const generateApplicationId = () => {
    const firstPart = crypto_1.default.randomBytes(2).toString("hex").toUpperCase();
    const secondPart = crypto_1.default.randomBytes(2).toString("hex").toUpperCase();
    return `BM-${firstPart}-${secondPart}`;
};
exports.generateApplicationId = generateApplicationId;
/**
 * Generates a random secure password
 * Password contains uppercase, lowercase, numbers and special characters
 * Length: 10 characters
 */
const generateRandomPassword = () => {
    const uppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercaseChars = "abcdefghijkmnopqrstuvwxyz";
    const numberChars = "23456789";
    const specialChars = "!@#$%^&*()_+";
    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
    let password = "";
    // Ensure at least one character from each group
    password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
    password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
    password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    // Fill the rest with random characters
    for (let i = 0; i < 6; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    // Shuffle the password
    return password
        .split("")
        .sort(() => 0.5 - Math.random())
        .join("");
};
exports.generateRandomPassword = generateRandomPassword;
