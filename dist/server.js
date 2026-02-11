"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const dbConnection_1 = __importDefault(require("./config/dbConnection"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
//Routes
const auth_1 = __importDefault(require("./routes/auth"));
const bikes_routes_1 = __importDefault(require("./routes/BikeSystemRoutes/bikes.routes"));
const bikeImages_routes_1 = __importDefault(require("./routes/BikeSystemRoutes/bikeImages.routes"));
const enquiryForm_1 = __importDefault(require("./routes/enquiryForm"));
const branches_1 = __importDefault(require("./routes/branches"));
const cloudinary_1 = __importDefault(require("./routes/cloudinary"));
const getapproved_1 = __importDefault(require("./routes/getapproved"));
const visitorR_1 = __importDefault(require("./routes/visitorR"));
//new
const customer_1 = __importDefault(require("./routes/customerRoutes/customer"));
const customerProfile_1 = __importDefault(require("./routes/customerRoutes/customerProfile"));
const serviceBooking_1 = __importDefault(require("./routes/customerRoutes/serviceBooking"));
const VAS_1 = __importDefault(require("./routes/BikeSystemRoutes2/VAS"));
const CustomerVehicleRoutes_1 = __importDefault(require("./routes/BikeSystemRoutes2/CustomerVehicleRoutes"));
const stockConcept_1 = __importDefault(require("./routes/BikeSystemRoutes2/stockConcept"));
//
const csvStock_1 = __importDefault(require("./routes/BikeSystemRoutes3/csvStock"));
const corOptions_1 = __importDefault(require("./config/corOptions"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
dotenv_1.default.config();
// Create Express application
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
//CORS
app.use((0, cors_1.default)(corOptions_1.default));
// Body Parsers
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes",
});
// Health check endpoints (no rate limiting)
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Honda-Dealer Golaghat API is running",
        version: "1.0.0",
    });
});
app.get("/_ah/health", (req, res) => {
    res.status(200).send("OK");
});
app.get("/_ah/start", (req, res) => {
    res.status(200).send("OK");
});
// Apply rate limiter to all /api routes
app.use("/api", apiLimiter);
// Admin & Auth
app.use("/api/adminLogin", auth_1.default);
// Bike System
app.use("/api/bikes", bikes_routes_1.default);
app.use("/api/bike-images", bikeImages_routes_1.default);
app.use("/api/stock-concept", stockConcept_1.default);
app.use("/api/value-added-services", VAS_1.default);
app.use("/api/csv-stock", csvStock_1.default);
// Customer System
app.use("/api/customer", customer_1.default);
app.use("/api/customer-profile", customerProfile_1.default);
app.use("/api/customer-vehicles", CustomerVehicleRoutes_1.default);
app.use("/api/service-bookings", serviceBooking_1.default);
// Other Services
app.use("/api/cloudinary", cloudinary_1.default);
app.use("/api/branch", branches_1.default);
app.use("/api/enquiry-form", enquiryForm_1.default);
app.use("/api/getapproved", getapproved_1.default);
app.use("/api/visitor", visitorR_1.default);
// Global error handling middleware
app.use((err, req, res, next) => {
    console.error("Global error handler:", {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
    });
    res.status(500).json({
        success: false,
        error: "Something went wrong!",
        message: process.env.NODE_ENV === "development"
            ? err.message
            : "Internal server error",
    });
});
// 404 handler
app.use(errorMiddleware_1.routeNotFound);
// Custom error handler
app.use(errorMiddleware_1.errorHandler);
(0, dbConnection_1.default)().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
});
exports.default = app;
