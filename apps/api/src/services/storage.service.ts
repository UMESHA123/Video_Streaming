import fs from "fs";
import path from "path";
import { PATHS } from "../config/paths.js";

export function ensureDirectories(): void {
  const dirs = [
    PATHS.storage,
    PATHS.uploads,
    PATHS.videos,
    PATHS.thumbnails,
    PATHS.avatars,
    PATHS.db,
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Failed to delete file: ${filePath}`, err);
  }
}

export function deleteDirectory(dirPath: string): void {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`Failed to delete directory: ${dirPath}`, err);
  }
}

export function getVideoDir(videoId: string): string {
  return path.join(PATHS.videos, videoId);
}

export function ensureVideoDir(videoId: string): string {
  const dir = getVideoDir(videoId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}
