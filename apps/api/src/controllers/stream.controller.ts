import type { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { getVideoDir } from "../services/storage.service.js";
import { createError } from "../middleware/error.middleware.js";

export function masterPlaylist(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { videoId } = req.params;
    const videoDir = getVideoDir(videoId);
    const masterPath = path.join(videoDir, "master.m3u8");

    if (!fs.existsSync(masterPath)) {
      throw createError(404, "Playlist not found");
    }

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "no-cache");
    fs.createReadStream(masterPath).pipe(res);
  } catch (err) {
    next(err);
  }
}

export function qualityPlaylist(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { videoId, quality } = req.params;
    const videoDir = getVideoDir(videoId);
    const playlistPath = path.join(videoDir, quality, "playlist.m3u8");

    if (!fs.existsSync(playlistPath)) {
      throw createError(404, "Quality playlist not found");
    }

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "no-cache");
    fs.createReadStream(playlistPath).pipe(res);
  } catch (err) {
    next(err);
  }
}

export function segment(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { videoId, quality, segment: segmentName } = req.params;
    const videoDir = getVideoDir(videoId);
    const segmentPath = path.join(videoDir, quality, segmentName);

    if (!fs.existsSync(segmentPath)) {
      throw createError(404, "Segment not found");
    }

    res.setHeader("Content-Type", "video/mp2t");
    res.setHeader("Cache-Control", "public, max-age=31536000");
    fs.createReadStream(segmentPath).pipe(res);
  } catch (err) {
    next(err);
  }
}
