import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";

import authRoutes from "./src/routes/auth.js";
import profileRoutes from "./src/routes/profiles.js";

const app = express();

// Standard Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// --- THE SWITCHBOARD ---

// Auth Routes (Handles /api/v1/auth/callback)
app.use("/api/v1/auth", authRoutes);

// Modern Profile Routes (Stage 3)
app.use("/api/v1/profiles", profileRoutes);

// Legacy Profile Routes (Stage 2 compatibility)
app.use("/api/profiles", profileRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 System Live on port ${PORT}`));
