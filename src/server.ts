import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/dbConnection";
import { errorHandler, routeNotFound } from "./middleware/errorMiddleware";
import auth from "./routes/auth";
import bikes from "./routes/bikes";
import scooty from "./routes/scooty";
import branchRoutes from "./routes/branches";
import staffRoutes from "./routes/staff";

import corsOptions from "./config/corOptions";
import rateLimit from "express-rate-limit";

// Create Express application
const app: Application = express();
dotenv.config();

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

app.use("/api/adminLogin", auth);
app.use("/api/branch", branchRoutes);
app.use("/api/bikes", bikes);
app.use("/api/scooty", scooty);
app.use("/api/staff", staffRoutes);

// Apply rate limiting to API routes except health checks
app.use("/api", apiLimiter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Centralized Error Handler
app.use(routeNotFound);
app.use(errorHandler);

// Connect to MongoDB
connectDB();

export default app;
