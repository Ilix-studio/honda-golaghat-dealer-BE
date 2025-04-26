import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/dbConnection";
import { errorHandler, routeNotFound } from "./middleware/errorMiddleware";
import auth from "./routes/auth";

// Create Express application
const app: Application = express();
dotenv.config();

const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (add this before other routes)
app.get("/", (req: Request, res: Response) => {
  res.status(200).send("server is ready");
});

app.listen(PORT, () => {
  console.log(`Listening to http://localhost:${PORT}`);
});

app.use("/api/adminLogin", auth);

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
