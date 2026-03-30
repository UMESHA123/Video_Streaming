import fs from "fs";
import path from "path";
import { PATHS } from "../config/paths.js";
import type { User, Video, Comment, Interactions } from "./schema.js";

const USERS_FILE = path.join(PATHS.db, "users.json");
const VIDEOS_FILE = path.join(PATHS.db, "videos.json");
const COMMENTS_FILE = path.join(PATHS.db, "comments.json");
const INTERACTIONS_FILE = path.join(PATHS.db, "interactions.json");

function ensureDbDir(): void {
  if (!fs.existsSync(PATHS.db)) {
    fs.mkdirSync(PATHS.db, { recursive: true });
  }
}

function initFileIfMissing(filePath: string, defaultData: unknown): void {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), "utf-8");
  }
}

export function initDatabase(): void {
  ensureDbDir();
  initFileIfMissing(USERS_FILE, []);
  initFileIfMissing(VIDEOS_FILE, []);
  initFileIfMissing(COMMENTS_FILE, []);
  initFileIfMissing(INTERACTIONS_FILE, { likes: [], watchHistory: [] });
}

function readJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);

  // Handle wrapped format (e.g. {"videos":[]} -> [])
  // If we expect an array but got an object with a single array property, unwrap it
  if (Array.isArray(parsed)) {
    return parsed as T;
  }
  if (typeof parsed === "object" && parsed !== null) {
    const keys = Object.keys(parsed);
    if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
      return parsed[keys[0]] as T;
    }
  }

  return parsed as T;
}

function writeJson<T>(filePath: string, data: T): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Users
export function readUsers(): User[] {
  return readJson<User[]>(USERS_FILE);
}

export function writeUsers(users: User[]): void {
  writeJson(USERS_FILE, users);
}

// Videos
export function readVideos(): Video[] {
  return readJson<Video[]>(VIDEOS_FILE);
}

export function writeVideos(videos: Video[]): void {
  writeJson(VIDEOS_FILE, videos);
}

// Comments
export function readComments(): Comment[] {
  return readJson<Comment[]>(COMMENTS_FILE);
}

export function writeComments(comments: Comment[]): void {
  writeJson(COMMENTS_FILE, comments);
}

// Interactions
export function readInteractions(): Interactions {
  return readJson<Interactions>(INTERACTIONS_FILE);
}

export function writeInteractions(interactions: Interactions): void {
  writeJson(INTERACTIONS_FILE, interactions);
}
