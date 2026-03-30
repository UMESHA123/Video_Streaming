import type { Request, Response, NextFunction } from "express";
import {
  readUsers,
  writeUsers,
  readVideos,
  readInteractions,
} from "../db/db.js";
import type { User } from "../db/schema.js";
import { createError } from "../middleware/error.middleware.js";

function sanitizeUser(user: User) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { username } = req.params;
    const users = readUsers();
    const user = users.find((u) => u.username === username);

    if (!user) {
      throw createError(404, "User not found");
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

export function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw createError(401, "Authentication required");
    }

    const { bio, username } = req.body;
    const users = readUsers();
    const userIndex = users.findIndex((u) => u.id === req.user!.userId);

    if (userIndex === -1) {
      throw createError(404, "User not found");
    }

    if (username !== undefined) {
      const existing = users.find(
        (u) => u.username === username && u.id !== req.user!.userId
      );
      if (existing) {
        throw createError(409, "Username already taken");
      }
      users[userIndex].username = username;
    }

    if (bio !== undefined) {
      users[userIndex].bio = bio;
    }

    writeUsers(users);

    res.json({ user: sanitizeUser(users[userIndex]) });
  } catch (err) {
    next(err);
  }
}

export function getWatchHistory(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw createError(401, "Authentication required");
    }

    const interactions = readInteractions();
    const history = interactions.watchHistory
      .filter((h) => h.userId === req.user!.userId)
      .sort(
        (a, b) =>
          new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
      );

    // Enrich with video data
    const videos = readVideos();
    const enriched = history
      .map((entry) => {
        const video = videos.find((v) => v.id === entry.videoId);
        return video ? { ...entry, video } : null;
      })
      .filter(Boolean);

    res.json({ history: enriched });
  } catch (err) {
    next(err);
  }
}

export function getUserVideos(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { username } = req.params;
    const users = readUsers();
    const user = users.find((u) => u.username === username);

    if (!user) {
      throw createError(404, "User not found");
    }

    const videos = readVideos()
      .filter((v) => v.userId === user.id && v.status === "ready")
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    res.json({ videos });
  } catch (err) {
    next(err);
  }
}
