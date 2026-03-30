import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import {
  listVideos,
  uploadVideo,
  getVideo,
  getVideoStatus,
  deleteVideo,
  likeVideo,
  unlikeVideo,
  searchVideos,
} from "../controllers/video.controller.js";
import { authenticate, optionalAuth } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

// Wrap multer to catch file filter errors and return 400 instead of 500
function handleUpload(req: Request, res: Response, next: NextFunction): void {
  upload.single("video")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
}

router.get("/", optionalAuth, listVideos);
router.post("/upload", authenticate, handleUpload, uploadVideo);
router.get("/search", searchVideos);
router.get("/:id", optionalAuth, getVideo);
router.get("/:id/status", getVideoStatus);
router.delete("/:id", authenticate, deleteVideo);
router.post("/:id/like", authenticate, likeVideo);
router.delete("/:id/like", authenticate, unlikeVideo);

export default router;
