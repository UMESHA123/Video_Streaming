import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root (two levels up from apps/api)
dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

import express from "express";
import cors from "cors";
import { PATHS } from "./config/paths.js";
import { configureFfmpeg } from "./config/ffmpeg.js";
import { initDatabase } from "./db/db.js";
import { ensureDirectories } from "./services/storage.service.js";
import { initTranscodeQueue } from "./services/queue.service.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { createLogger } from "./utils/logger.js";

const log = createLogger("Server");

// Routes
import authRoutes from "./routes/auth.routes.js";
import videoRoutes from "./routes/video.routes.js";
import streamRoutes from "./routes/stream.routes.js";
import userRoutes from "./routes/user.routes.js";
import commentRoutes from "./routes/comment.routes.js";

const app = express();
const PORT = parseInt(process.env.API_PORT || "4000", 10);

// Initialize
log.info("Initializing StreamLocal API...");
ensureDirectories();
initDatabase();
configureFfmpeg();
initTranscodeQueue();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    log.info(`${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Static files
app.use("/thumbnails", express.static(PATHS.thumbnails));
app.use("/avatars", express.static(PATHS.avatars));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  log.info(`StreamLocal API server running on http://localhost:${PORT}`);
  log.info(`Storage path: ${PATHS.storage}`);
  log.info(`Database path: ${PATHS.db}`);
});

export default app;
