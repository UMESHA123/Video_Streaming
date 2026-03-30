import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  readVideos,
  writeVideos,
  readInteractions,
  writeInteractions,
} from "../db/db.js";
import type { Video } from "../db/schema.js";
import { createError } from "../middleware/error.middleware.js";
import { addTranscodeJob } from "../services/queue.service.js";
import { searchVideos as fuzzySearch } from "../services/search.service.js";
import { deleteFile, deleteDirectory, getVideoDir } from "../services/storage.service.js";
import { PATHS } from "../config/paths.js";
import path from "path";

export function listVideos(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
    const offset = (page - 1) * limit;

    const videos = readVideos().filter((v) => v.status === "ready");

    // Sort by createdAt descending (newest first)
    videos.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = videos.length;
    const paginated = videos.slice(offset, offset + limit);

    res.json({
      videos: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadVideo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw createError(401, "Authentication required");
    }

    if (!req.file) {
      throw createError(400, "No video file provided");
    }

    const { title, description, tags } = req.body;

    if (!title) {
      throw createError(400, "Title is required");
    }

    const videoId = uuidv4();
    let parsedTags: string[] = [];
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else if (typeof tags === "string") {
        try {
          const parsed = JSON.parse(tags);
          parsedTags = Array.isArray(parsed) ? parsed : [tags];
        } catch {
          parsedTags = tags.split(",").map((t: string) => t.trim()).filter(Boolean);
        }
      }
    }

    const video: Video = {
      id: videoId,
      userId: req.user.userId,
      title,
      description: description || "",
      status: "uploading",
      duration: 0,
      fileSize: req.file.size,
      thumbnailUrl: "",
      hlsUrl: "",
      views: 0,
      likes: 0,
      tags: parsedTags,
      createdAt: new Date().toISOString(),
    };

    const videos = readVideos();
    videos.push(video);
    writeVideos(videos);

    // Queue transcoding job
    await addTranscodeJob(videoId, req.file.path);

    res.status(201).json({ video });
  } catch (err) {
    next(err);
  }
}

export function getVideo(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { id } = req.params;
    const videos = readVideos();
    const video = videos.find((v) => v.id === id);

    if (!video) {
      throw createError(404, "Video not found");
    }

    // Increment view count
    video.views += 1;
    writeVideos(videos);

    res.json({ video });
  } catch (err) {
    next(err);
  }
}

export function getVideoStatus(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { id } = req.params;
    const videos = readVideos();
    const video = videos.find((v) => v.id === id);

    if (!video) {
      throw createError(404, "Video not found");
    }

    res.json({
      id: video.id,
      status: video.status,
      hlsUrl: video.hlsUrl,
      thumbnailUrl: video.thumbnailUrl,
    });
  } catch (err) {
    next(err);
  }
}

export function deleteVideo(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw createError(401, "Authentication required");
    }

    const { id } = req.params;
    const videos = readVideos();
    const videoIndex = videos.findIndex((v) => v.id === id);

    if (videoIndex === -1) {
      throw createError(404, "Video not found");
    }

    const video = videos[videoIndex];

    if (video.userId !== req.user.userId) {
      throw createError(403, "You can only delete your own videos");
    }

    // Remove video files
    const videoDir = getVideoDir(id);
    deleteDirectory(videoDir);

    // Remove thumbnail
    if (video.thumbnailUrl) {
      const thumbnailPath = path.join(PATHS.thumbnails, `${id}.jpg`);
      deleteFile(thumbnailPath);
    }

    // Remove from database
    videos.splice(videoIndex, 1);
    writeVideos(videos);

    // Remove associated likes
    const interactions = readInteractions();
    interactions.likes = interactions.likes.filter((l) => l.videoId !== id);
    writeInteractions(interactions);

    res.json({ message: "Video deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export function likeVideo(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw createError(401, "Authentication required");
    }

    const { id } = req.params;
    const videos = readVideos();
    const video = videos.find((v) => v.id === id);

    if (!video) {
      throw createError(404, "Video not found");
    }

    const interactions = readInteractions();
    const existingLike = interactions.likes.find(
      (l) => l.userId === req.user!.userId && l.videoId === id
    );

    if (existingLike) {
      throw createError(409, "Already liked this video");
    }

    interactions.likes.push({
      userId: req.user.userId,
      videoId: id,
      createdAt: new Date().toISOString(),
    });
    writeInteractions(interactions);

    // Update like count on video
    video.likes += 1;
    writeVideos(videos);

    res.json({ message: "Video liked", likes: video.likes });
  } catch (err) {
    next(err);
  }
}

export function unlikeVideo(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw createError(401, "Authentication required");
    }

    const { id } = req.params;
    const videos = readVideos();
    const video = videos.find((v) => v.id === id);

    if (!video) {
      throw createError(404, "Video not found");
    }

    const interactions = readInteractions();
    const likeIndex = interactions.likes.findIndex(
      (l) => l.userId === req.user!.userId && l.videoId === id
    );

    if (likeIndex === -1) {
      throw createError(404, "Like not found");
    }

    interactions.likes.splice(likeIndex, 1);
    writeInteractions(interactions);

    video.likes = Math.max(0, video.likes - 1);
    writeVideos(videos);

    res.json({ message: "Like removed", likes: video.likes });
  } catch (err) {
    next(err);
  }
}

export function searchVideos(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const query = (req.query.q as string) || "";

    if (!query.trim()) {
      throw createError(400, "Search query is required");
    }

    const results = fuzzySearch(query);
    res.json({ videos: results });
  } catch (err) {
    next(err);
  }
}
