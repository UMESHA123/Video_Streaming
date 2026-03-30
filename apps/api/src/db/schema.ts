export interface Video {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: "uploading" | "processing" | "ready" | "failed";
  duration: number;
  fileSize: number;
  thumbnailUrl: string;
  hlsUrl: string;
  views: number;
  likes: number;
  tags: string[];
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatarUrl: string;
  bio: string;
  plan: "free" | "pro";
  createdAt: string;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Like {
  userId: string;
  videoId: string;
  createdAt: string;
}

export interface WatchHistoryEntry {
  userId: string;
  videoId: string;
  progress: number;
  watchedAt: string;
}

export interface Interactions {
  likes: Like[];
  watchHistory: WatchHistoryEntry[];
}

export interface DatabaseSchema {
  users: User[];
  videos: Video[];
  comments: Comment[];
  interactions: Interactions;
}
