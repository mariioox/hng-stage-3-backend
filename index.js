import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import profileRoutes from "./src/routes/profiles.js";
import authRoutes from "./src/routes/auth.js";

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// --- ROUTES ---

// LEGACY (Stage 2)
app.use("/api/profiles", profileRoutes);

// MODERN (Stage 3)
app.use("/api/v1/profiles", profileRoutes);
app.use("/api/v1/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 System Live on port ${PORT}`));
