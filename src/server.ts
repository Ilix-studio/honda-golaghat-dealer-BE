import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/dbConnection";
import { errorHandler, routeNotFound } from "./middleware/errorMiddleware";
//Routes
import auth from "./routes/auth";
import bikes from "./routes/bikes";
import scooty from "./routes/scooty";
import branchRoutes from "./routes/branches";
import staffRoutes from "./routes/staff";

import configRoutes from "./routes/config";
import cloudinaryRoutes from "./routes/cloudinary";
import getApprovedRoutes from "./routes/getapproved";
//new
import customerRoutes from "./routes/customer/customer";
import customerProfile from "./routes/customer/customerProfile";
import customerDashboardRoutes from "./routes/customer/customerDashboard";
import serviceBookingRoutes from "./routes/serviceBooking";
import servicePackageRoutes from "./routes/customer/servicePackage";
import valueAddedServicesRoutes from "./routes/customer/VAS";
import visitorRoutes from "./routes/visitorR";
import motorcycleInfoRoutes from "./routes/customer/motorcycleInfo";

import corsOptions from "./config/corOptions";
import rateLimit from "express-rate-limit";

dotenv.config();

// Create Express application
const app: Application = express();

const PORT = process.env.PORT || 8080;

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});

//CORS
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoints (no rate limiting)
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Honda-Dealer Golaghat API is running",
    version: "1.0.0",
  });
});
app.get("/_ah/health", (req: Request, res: Response) => {
  res.status(200).send("OK");
});

app.get("/_ah/start", (req: Request, res: Response) => {
  res.status(200).send("OK");
});

app.listen(PORT, () => {
  console.log(`Listening to http://localhost:${PORT}`);
});

app.use("/api/cloudinary", cloudinaryRoutes);
app.use("/api/adminLogin", auth);
app.use("/api/branch", branchRoutes);
app.use("/api/bikes", bikes);
app.use("/api/scooty", scooty);
app.use("/api/staff", staffRoutes);
app.use("/api/config", configRoutes);
app.use("/api/getapproved", getApprovedRoutes);
//update
app.use("/api/visitor", visitorRoutes);
//update
app.use("/api/customer", customerRoutes);
app.use("/api/customer-profile", customerProfile);
app.use("/api/customer-dashboard", customerDashboardRoutes);
app.use("/api/service-bookings", serviceBookingRoutes);
app.use("/api/service-packages", servicePackageRoutes);
app.use("/api/value-added-services", valueAddedServicesRoutes);
app.use("/api/motorcycle-info", motorcycleInfoRoutes);

// Apply rate limiting to API routes except health checks
app.use("/api", apiLimiter);

// Global error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// Centralized Error Handler
app.use(routeNotFound);
app.use(errorHandler);

// Connect to MongoDB
connectDB();

export default app;
//Register not working
