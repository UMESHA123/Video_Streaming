import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  readComments,
  writeComments,
  readVideos,
  readUsers,
} from "../db/db.js";
import type { Comment } from "../db/schema.js";
import { createError } from "../middleware/error.middleware.js";

export function getComments(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { videoId } = req.params;

    // Verify video exists
    const videos = readVideos();
    if (!videos.find((v) => v.id === videoId)) {
      throw createError(404, "Video not found");
    }

    const comments = readComments()
      .filter((c) => c.videoId === videoId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    // Enrich with user info
    const users = readUsers();
    const enriched = comments.map((comment) => {
      const user = users.find((u) => u.id === comment.userId);
      return {
        ...comment,
        user: user
          ? { id: user.id, username: user.username, avatarUrl: user.avatarUrl }
          : null,
      };
    });

    res.json({ comments: enriched });
  } catch (err) {
    next(err);
  }
}

export function addComment(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw createError(401, "Authentication required");
    }

    const { videoId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      throw createError(400, "Comment text is required");
    }

    // Verify video exists
    const videos = readVideos();
    if (!videos.find((v) => v.id === videoId)) {
      throw createError(404, "Video not found");
    }

    const comment: Comment = {
      id: uuidv4(),
      videoId,
      userId: req.user.userId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    const comments = readComments();
    comments.push(comment);
    writeComments(comments);

    // Return with user info
    const users = readUsers();
    const user = users.find((u) => u.id === req.user!.userId);

    res.status(201).json({
      comment: {
        ...comment,
        user: user
          ? { id: user.id, username: user.username, avatarUrl: user.avatarUrl }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export function deleteComment(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw createError(401, "Authentication required");
    }

    const { videoId, commentId } = req.params;
    const comments = readComments();
    const commentIndex = comments.findIndex(
      (c) => c.id === commentId && c.videoId === videoId
    );

    if (commentIndex === -1) {
      throw createError(404, "Comment not found");
    }

    const comment = comments[commentIndex];

    if (comment.userId !== req.user.userId) {
      throw createError(403, "You can only delete your own comments");
    }

    comments.splice(commentIndex, 1);
    writeComments(comments);

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    next(err);
  }
}
