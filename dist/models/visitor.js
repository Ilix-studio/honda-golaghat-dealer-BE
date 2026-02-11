"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/visitorModel.ts
const mongoose_1 = __importStar(require("mongoose"));
// Daily visit schema
const dailyVisitSchema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: true,
    },
    count: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
});
// Main visitor schema
const visitorSchema = new mongoose_1.Schema({
    totalVisitors: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    lastVisit: {
        type: Date,
        default: Date.now,
    },
    dailyVisits: {
        type: [dailyVisitSchema],
        default: [],
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
    collection: "visitors", // Specify collection name
});
// Index for better query performance
visitorSchema.index({ "dailyVisits.date": 1 });
// Static method to get or create visitor data
visitorSchema.statics.getOrCreate = async function () {
    let visitor = await this.findOne();
    if (!visitor) {
        visitor = await this.create({
            totalVisitors: 0,
            lastVisit: new Date(),
            dailyVisits: [],
        });
    }
    return visitor;
};
// Instance method to increment count
visitorSchema.methods.incrementCount = async function () {
    this.totalVisitors += 1;
    this.lastVisit = new Date();
    // Update daily visits
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // Find today's entry
    const todayEntry = this.dailyVisits.find((visit) => visit.date.toDateString() === todayStart.toDateString());
    if (todayEntry) {
        todayEntry.count += 1;
    }
    else {
        this.dailyVisits.push({
            date: todayStart,
            count: 1,
        });
        // Keep only last 30 days
        if (this.dailyVisits.length > 30) {
            this.dailyVisits = this.dailyVisits
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .slice(0, 30);
        }
    }
    return this.save();
};
// Instance method to get today's visitor count
visitorSchema.methods.getTodayCount = function () {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEntry = this.dailyVisits.find((visit) => visit.date.toDateString() === todayStart.toDateString());
    return todayEntry ? todayEntry.count : 0;
};
// Instance method to get weekly stats
visitorSchema.methods.getWeeklyStats = function () {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thisWeekVisits = this.dailyVisits
        .filter((visit) => visit.date >= weekAgo)
        .reduce((sum, visit) => sum + visit.count, 0);
    const lastWeekVisits = this.dailyVisits
        .filter((visit) => visit.date >= twoWeeksAgo && visit.date < weekAgo)
        .reduce((sum, visit) => sum + visit.count, 0);
    const growth = lastWeekVisits > 0
        ? ((thisWeekVisits - lastWeekVisits) / lastWeekVisits) * 100
        : 0;
    return {
        thisWeek: thisWeekVisits,
        lastWeek: lastWeekVisits,
        growth: Math.round(growth * 100) / 100,
    };
};
// Export the model
const VisitorModel = mongoose_1.default.model("Visitor", visitorSchema);
exports.default = VisitorModel;
