import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getWatchHistory,
  getUserVideos,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/me/history", authenticate, getWatchHistory);
router.patch("/me", authenticate, updateProfile);
router.get("/:username", getProfile);
router.get("/:username/videos", getUserVideos);

export default router;
