import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import cors from "cors";
import authRoutes from "../routes/auth.js";
import emailRoutes from "../routes/email.js";
import chatRoutes from "../routes/chat.js";
import cookieParser from "cookie-parser";
import morgan from "morgan";
const app = express();
app.use(morgan("dev"))

app.use(cookieParser());
app.use(express.json());

// CORS - allow frontend dev server
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

// Middleware for parsing JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Error handler for JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format in request body",
    });
  }
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/email", emailRoutes);
app.use("/api", chatRoutes);
// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

// Serve frontend static files from public/
app.use(express.static(path.join(__dirname, "../public")));

// SPA fallback — serve index.html for all non-API routes (React Router)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Global Error Handler (Must be last)
app.use((err, req, res, next) => {
  console.error("Global error:", err);

  // Handle specific error types
  if (err.name === "MongoNetworkError") {
    return res.status(503).json({
      success: false,
      message: "Database connection error. Please try again later.",
    });
  }

  if (err.name === "MongooseError") {
    return res.status(500).json({
      success: false,
      message: "A database error occurred. Please try again.",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected error occurred. Please try again.",
  });
});

export default app;