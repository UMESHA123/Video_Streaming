# 🎬 Local Video Streaming Platform — Complete Project Specification

**Project Name:** StreamLocal  
**Stack:** Next.js (Frontend) + Express.js (Backend API)  
**Storage:** Local File System (No Cloud)  
**Version:** 1.0.0  
**Last Updated:** 2026-03-29

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Architecture Overview](#4-architecture-overview)
5. [Backend — Express.js API](#5-backend--expressjs-api)
6. [Frontend — Next.js](#6-frontend--nextjs)
7. [Local Storage Strategy](#7-local-storage-strategy)
8. [Video Processing Pipeline](#8-video-processing-pipeline)
9. [API Endpoints Reference](#9-api-endpoints-reference)
10. [Database Schema (JSON-based)](#10-database-schema-json-based)
11. [Environment Configuration](#11-environment-configuration)
12. [Development Roadmap](#12-development-roadmap)
13. [Setup & Installation](#13-setup--installation)
14. [Folder Conventions & Naming](#14-folder-conventions--naming)

---

## 1. Project Overview

StreamLocal is a **fully local video streaming platform** built with Next.js and Express.js. It allows users to upload, process, and stream videos using adaptive bitrate (HLS) without any cloud dependency. All videos, thumbnails, and metadata are stored on the local file system. A JSON-based flat-file database is used for metadata persistence.

### Goals
- Upload videos and transcode them locally using FFmpeg
- Stream videos using HLS (HTTP Live Streaming) protocol
- Browse, search, and watch videos from a modern UI
- Manage users, likes, comments, and watch history — all locally
- No internet or cloud services required to run

---

## 2. Tech Stack

| Layer              | Technology                          | Purpose                              |
|--------------------|--------------------------------------|--------------------------------------|
| Frontend           | Next.js 14 (App Router)             | UI, routing, SSR/CSR pages           |
| Video Player       | HLS.js + Video.js                   | Adaptive bitrate playback            |
| Backend API        | Express.js (Node.js)                | REST API server                      |
| Video Processing   | FFmpeg (local binary)               | Transcoding, HLS segmentation        |
| Metadata Storage   | JSON flat files (lowdb)             | Video/user metadata persistence      |
| File Storage       | Local filesystem (`/storage`)       | Raw uploads + HLS segments           |
| Authentication     | JWT (jsonwebtoken)                  | Stateless auth tokens                |
| Job Queue          | Bull + Redis (local)                | Async transcoding jobs               |
| Search             | Fuse.js                             | In-memory fuzzy search               |
| Styling            | Tailwind CSS                        | Utility-first styling                |
| Package Manager    | pnpm                                | Monorepo-friendly, fast              |

---

## 3. Project Structure

```
streamlocal/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Home / feed
│   │   │   ├── watch/[id]/
│   │   │   │   └── page.tsx          # Video watch page
│   │   │   ├── upload/
│   │   │   │   └── page.tsx          # Upload page
│   │   │   ├── search/
│   │   │   │   └── page.tsx          # Search results
│   │   │   ├── profile/[username]/
│   │   │   │   └── page.tsx          # User profile
│   │   │   └── auth/
│   │   │       ├── login/page.tsx
│   │   │       └── register/page.tsx
│   │   ├── components/
│   │   │   ├── VideoCard.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── UploadForm.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── CommentSection.tsx
│   │   │   └── Navbar.tsx
│   │   ├── lib/
│   │   │   ├── api.ts                # Axios API client
│   │   │   └── auth.ts               # JWT helpers (client-side)
│   │   ├── hooks/
│   │   │   ├── useVideo.ts
│   │   │   └── useAuth.ts
│   │   ├── next.config.js
│   │   └── tailwind.config.js
│   │
│   └── api/                          # Express.js backend
│       ├── src/
│       │   ├── index.ts              # Entry point
│       │   ├── config/
│       │   │   ├── paths.ts          # Storage paths config
│       │   │   └── ffmpeg.ts         # FFmpeg config
│       │   ├── routes/
│       │   │   ├── auth.routes.ts
│       │   │   ├── video.routes.ts
│       │   │   ├── user.routes.ts
│       │   │   ├── comment.routes.ts
│       │   │   └── stream.routes.ts
│       │   ├── controllers/
│       │   │   ├── auth.controller.ts
│       │   │   ├── video.controller.ts
│       │   │   ├── user.controller.ts
│       │   │   ├── comment.controller.ts
│       │   │   └── stream.controller.ts
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts
│       │   │   ├── upload.middleware.ts
│       │   │   └── error.middleware.ts
│       │   ├── services/
│       │   │   ├── ffmpeg.service.ts
│       │   │   ├── storage.service.ts
│       │   │   ├── search.service.ts
│       │   │   └── queue.service.ts
│       │   └── db/
│       │       ├── db.ts             # lowdb instance
│       │       └── schema.ts         # JSON DB type definitions
│       ├── tsconfig.json
│       └── package.json
│
├── storage/                          # All local file storage
│   ├── uploads/                      # Raw video uploads (temp)
│   │   └── {videoId}.{ext}
│   ├── videos/                       # Processed HLS output
│   │   └── {videoId}/
│   │       ├── master.m3u8
│   │       ├── 1080p/
│   │       │   ├── playlist.m3u8
│   │       │   └── segment_*.ts
│   │       ├── 720p/
│   │       ├── 480p/
│   │       └── 360p/
│   ├── thumbnails/                   # Extracted thumbnails
│   │   └── {videoId}.jpg
│   └── avatars/                      # User profile pictures
│       └── {userId}.jpg
│
├── data/                             # JSON flat-file database
│   ├── users.json
│   ├── videos.json
│   ├── comments.json
│   └── interactions.json
│
├── package.json                      # Root workspace config
├── pnpm-workspace.yaml
└── .env
```

---

## 4. Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                   BROWSER / CLIENT                   │
│         Next.js App (localhost:3000)                 │
│   ┌──────────┐  ┌──────────┐  ┌────────────────┐    │
│   │  Pages   │  │ HLS.js   │  │  Axios Client  │    │
│   │ (App     │  │ Player   │  │  (API calls)   │    │
│   │ Router)  │  │          │  │                │    │
│   └────┬─────┘  └────┬─────┘  └───────┬────────┘    │
└────────┼─────────────┼────────────────┼─────────────┘
         │             │                │
         │        HLS stream        REST API
         │      (m3u8 + .ts)      (JSON responses)
         │             │                │
┌────────┼─────────────┼────────────────┼─────────────┐
│        │   EXPRESS.JS API (localhost:4000)            │
│   ┌────▼─────────────▼────────────────▼────────┐     │
│   │              API ROUTES                     │     │
│   │  /api/auth  /api/videos  /api/stream        │     │
│   │  /api/users  /api/comments  /api/search     │     │
│   └──────────────────┬───────────────────────── ┘     │
│                      │                                │
│        ┌─────────────┼──────────────┐                │
│        │             │              │                 │
│   ┌────▼────┐  ┌─────▼───┐  ┌──────▼──────┐         │
│   │  lowdb  │  │ FFmpeg  │  │  Bull Queue │         │
│   │  JSON   │  │ Service │  │  (Redis)    │         │
│   │  Store  │  │         │  │             │         │
│   └────┬────┘  └─────┬───┘  └─────────────┘         │
│        │             │                               │
│   ┌────▼─────────────▼───────────────────────┐       │
│   │         LOCAL FILE SYSTEM                 │       │
│   │   /storage/uploads/                       │       │
│   │   /storage/videos/{id}/  (HLS output)    │       │
│   │   /storage/thumbnails/                    │       │
│   │   /data/*.json            (DB)            │       │
│   └──────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────┘
```

---

## 5. Backend — Express.js API

### 5.1 Entry Point (`src/index.ts`)

```typescript
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.routes';
import videoRoutes from './routes/video.routes';
import streamRoutes from './routes/stream.routes';
import userRoutes from './routes/user.routes';
import commentRoutes from './routes/comment.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();
const PORT = process.env.API_PORT || 4000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Serve static files (thumbnails, avatars)
app.use('/thumbnails', express.static(path.join(__dirname, '../../storage/thumbnails')));
app.use('/avatars', express.static(path.join(__dirname, '../../storage/avatars')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);

app.use(errorMiddleware);
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
```

### 5.2 Storage Paths Config (`src/config/paths.ts`)

```typescript
import path from 'path';

const STORAGE_ROOT = path.join(process.cwd(), '../../storage');
const DATA_ROOT    = path.join(process.cwd(), '../../data');

export const PATHS = {
  uploads:    path.join(STORAGE_ROOT, 'uploads'),
  videos:     path.join(STORAGE_ROOT, 'videos'),
  thumbnails: path.join(STORAGE_ROOT, 'thumbnails'),
  avatars:    path.join(STORAGE_ROOT, 'avatars'),
  db: {
    users:        path.join(DATA_ROOT, 'users.json'),
    videos:       path.join(DATA_ROOT, 'videos.json'),
    comments:     path.join(DATA_ROOT, 'comments.json'),
    interactions: path.join(DATA_ROOT, 'interactions.json'),
  }
};
```

### 5.3 Upload Middleware (`src/middleware/upload.middleware.ts`)

```typescript
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PATHS } from '../config/paths';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PATHS.uploads),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10 GB max
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/mkv', 'video/webm', 'video/avi', 'video/mov'];
    cb(null, allowed.includes(file.mimetype));
  }
});
```

### 5.4 FFmpeg Service (`src/services/ffmpeg.service.ts`)

```typescript
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { PATHS } from '../config/paths';

export interface TranscodeOptions {
  videoId: string;
  inputPath: string;
  qualities: Array<{ name: string; resolution: string; bitrate: string }>;
}

const DEFAULT_QUALITIES = [
  { name: '1080p', resolution: '1920x1080', bitrate: '4000k' },
  { name: '720p',  resolution: '1280x720',  bitrate: '2500k' },
  { name: '480p',  resolution: '854x480',   bitrate: '1000k' },
  { name: '360p',  resolution: '640x360',   bitrate: '500k'  },
];

export async function transcodeToHLS(videoId: string, inputPath: string): Promise<string> {
  const outputDir = path.join(PATHS.videos, videoId);
  fs.mkdirSync(outputDir, { recursive: true });

  // Transcode each quality level
  for (const quality of DEFAULT_QUALITIES) {
    const qualityDir = path.join(outputDir, quality.name);
    fs.mkdirSync(qualityDir, { recursive: true });

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(quality.resolution)
        .videoBitrate(quality.bitrate)
        .outputOptions([
          '-hls_time 10',               // 10-second segments
          '-hls_playlist_type vod',
          `-hls_segment_filename ${qualityDir}/segment_%03d.ts`,
          '-start_number 0',
        ])
        .output(path.join(qualityDir, 'playlist.m3u8'))
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  // Generate master playlist
  const masterContent = DEFAULT_QUALITIES.map(q => [
    `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(q.bitrate) * 1000},RESOLUTION=${q.resolution}`,
    `${q.name}/playlist.m3u8`
  ].join('\n')).join('\n');

  const masterPath = path.join(outputDir, 'master.m3u8');
  fs.writeFileSync(masterPath, `#EXTM3U\n${masterContent}`);

  return masterPath;
}

export async function extractThumbnail(videoId: string, inputPath: string): Promise<string> {
  const thumbnailPath = path.join(PATHS.thumbnails, `${videoId}.jpg`);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        count: 1,
        timemarks: ['10%'],
        filename: `${videoId}.jpg`,
        folder: PATHS.thumbnails,
        size: '640x360',
      })
      .on('end', resolve)
      .on('error', reject);
  });

  return thumbnailPath;
}
```

---

## 6. Frontend — Next.js

### 6.1 Video Player Component (`components/VideoPlayer.tsx`)

```typescript
'use client';
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;        // URL to master.m3u8
  poster?: string;    // Thumbnail URL
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ autoStartLoad: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
      className="w-full rounded-xl bg-black"
    />
  );
}
```

### 6.2 Upload Form Component (`components/UploadForm.tsx`)

```typescript
'use client';
import { useState } from 'react';
import api from '@/lib/api';

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');

  const handleUpload = async () => {
    if (!file || !title) return;
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('description', description);

    setStatus('uploading');
    try {
      await api.post('/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded / (e.total ?? 1)) * 100));
        },
      });
      setStatus('processing');
      // Poll for processing status
      // ...
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <input
        type="text"
        placeholder="Video Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="w-full border rounded px-3 py-2 h-24"
      />
      <input
        type="file"
        accept="video/*"
        onChange={e => setFile(e.target.files?.[0] ?? null)}
      />
      {status === 'uploading' && (
        <div className="w-full bg-gray-200 rounded">
          <div className="bg-blue-500 h-2 rounded" style={{ width: `${progress}%` }} />
          <p className="text-sm text-center">{progress}% uploaded</p>
        </div>
      )}
      {status === 'processing' && <p className="text-yellow-600">⚙️ Processing video...</p>}
      {status === 'done' && <p className="text-green-600">✅ Video ready!</p>}
      <button
        onClick={handleUpload}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Upload Video
      </button>
    </div>
  );
}
```

---

## 7. Local Storage Strategy

### 7.1 File Storage Layout

All persistent data lives under two root directories:

| Directory           | Contents                                      |
|---------------------|-----------------------------------------------|
| `/storage/uploads/` | Raw uploaded videos (deleted after transcode) |
| `/storage/videos/`  | HLS-transcoded segments per video             |
| `/storage/thumbnails/` | JPEG thumbnails (640x360)                 |
| `/storage/avatars/` | User profile images                           |
| `/data/`            | JSON metadata files (lowdb)                   |

### 7.2 JSON Database (`lowdb`)

```typescript
// data/videos.json example
{
  "videos": [
    {
      "id": "abc-123",
      "userId": "user-456",
      "title": "My First Video",
      "description": "Hello world",
      "status": "ready",             // uploading | processing | ready | failed
      "duration": 183,               // seconds
      "thumbnailUrl": "/thumbnails/abc-123.jpg",
      "hlsUrl": "/stream/abc-123/master.m3u8",
      "views": 42,
      "likes": 7,
      "tags": ["tech", "tutorial"],
      "createdAt": "2026-03-29T10:00:00Z"
    }
  ]
}

// data/users.json example
{
  "users": [
    {
      "id": "user-456",
      "username": "johndoe",
      "email": "john@example.com",
      "passwordHash": "$2b$10$...",
      "avatarUrl": "/avatars/user-456.jpg",
      "plan": "free",
      "createdAt": "2026-03-29T09:00:00Z"
    }
  ]
}

// data/interactions.json example
{
  "likes": [
    { "userId": "user-456", "videoId": "abc-123", "createdAt": "..." }
  ],
  "watchHistory": [
    { "userId": "user-456", "videoId": "abc-123", "progress": 90, "watchedAt": "..." }
  ]
}
```

---

## 8. Video Processing Pipeline

```
Step 1: User submits upload form
         │
         ▼
Step 2: Multer saves raw file to /storage/uploads/{videoId}.{ext}
         │
         ▼
Step 3: Video record created in data/videos.json with status="uploading"
         │
         ▼
Step 4: Job added to Bull queue → status="processing"
         │
         ▼
Step 5: FFmpeg worker picks up the job
         ├── Transcodes to 4 quality levels (HLS segments)
         ├── Outputs to /storage/videos/{videoId}/
         └── Extracts thumbnail → /storage/thumbnails/{videoId}.jpg
         │
         ▼
Step 6: JSON DB updated → status="ready", hlsUrl set
         │
         ▼
Step 7: Raw upload deleted from /storage/uploads/
         │
         ▼
Step 8: Frontend polls /api/videos/{id}/status until "ready"
         │
         ▼
Step 9: Video available for streaming via /api/stream/{id}/master.m3u8
```

---

## 9. API Endpoints Reference

### Auth Routes — `/api/auth`

| Method | Endpoint            | Auth | Description                    |
|--------|---------------------|------|--------------------------------|
| POST   | `/register`         | No   | Create new user account        |
| POST   | `/login`            | No   | Login and receive JWT token    |
| POST   | `/logout`           | Yes  | Invalidate token               |
| GET    | `/me`               | Yes  | Get current user profile       |

### Video Routes — `/api/videos`

| Method | Endpoint              | Auth | Description                        |
|--------|-----------------------|------|------------------------------------|
| GET    | `/`                   | No   | List all videos (paginated)        |
| POST   | `/upload`             | Yes  | Upload a new video (multipart)     |
| GET    | `/:id`                | No   | Get video metadata by ID           |
| GET    | `/:id/status`         | No   | Poll processing status             |
| DELETE | `/:id`                | Yes  | Delete video (owner only)          |
| POST   | `/:id/like`           | Yes  | Like a video                       |
| DELETE | `/:id/like`           | Yes  | Unlike a video                     |
| GET    | `/search?q=`          | No   | Search videos by title/tags        |

### Stream Routes — `/api/stream`

| Method | Endpoint                        | Auth | Description                      |
|--------|---------------------------------|------|----------------------------------|
| GET    | `/:videoId/master.m3u8`         | No   | Serve HLS master playlist        |
| GET    | `/:videoId/:quality/playlist.m3u8` | No | Serve quality-level playlist    |
| GET    | `/:videoId/:quality/:segment`   | No   | Serve individual .ts segment     |

### User Routes — `/api/users`

| Method | Endpoint                | Auth | Description                      |
|--------|-------------------------|------|----------------------------------|
| GET    | `/:username`            | No   | Get public user profile          |
| PATCH  | `/me`                   | Yes  | Update own profile               |
| GET    | `/me/history`           | Yes  | Get watch history                |
| GET    | `/:username/videos`     | No   | List videos by user              |

### Comment Routes — `/api/comments`

| Method | Endpoint              | Auth | Description                        |
|--------|-----------------------|------|------------------------------------|
| GET    | `/:videoId`           | No   | Get all comments for a video       |
| POST   | `/:videoId`           | Yes  | Post a new comment                 |
| DELETE | `/:videoId/:commentId`| Yes  | Delete own comment                 |

---

## 10. Database Schema (JSON-based)

### `data/videos.json`

```typescript
interface Video {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  duration: number;           // seconds
  fileSize: number;           // bytes (original)
  thumbnailUrl: string;
  hlsUrl: string;             // path to master.m3u8
  views: number;
  likes: number;
  tags: string[];
  createdAt: string;          // ISO 8601
}
```

### `data/users.json`

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;       // bcrypt
  avatarUrl: string;
  bio: string;
  plan: 'free' | 'pro';
  createdAt: string;
}
```

### `data/comments.json`

```typescript
interface Comment {
  id: string;
  videoId: string;
  userId: string;
  text: string;
  createdAt: string;
}
```

### `data/interactions.json`

```typescript
interface Interactions {
  likes: Array<{ userId: string; videoId: string; createdAt: string }>;
  watchHistory: Array<{
    userId: string;
    videoId: string;
    progress: number;         // seconds watched
    watchedAt: string;
  }>;
}
```

---

## 11. Environment Configuration

### Root `.env`

```env
# Ports
API_PORT=4000
WEB_PORT=3000

# JWT
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d

# Storage Paths (relative to project root)
STORAGE_DIR=./storage
DATA_DIR=./data

# Redis (for Bull queue — local Redis)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# FFmpeg (path to local binary — leave blank if in PATH)
FFMPEG_PATH=
FFPROBE_PATH=

# Upload limits
MAX_UPLOAD_SIZE_GB=10
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_STREAM_URL=http://localhost:4000/stream
```

---

## 12. Development Roadmap

### Phase 1 — Core MVP (Weeks 1–3)
- [ ] Project scaffolding (monorepo with pnpm)
- [ ] Express API server with routing structure
- [ ] Multer file upload to `/storage/uploads/`
- [ ] FFmpeg transcoding service (all 4 qualities)
- [ ] HLS segment serving via static Express route
- [ ] lowdb JSON database setup
- [ ] JWT authentication (register/login)
- [ ] Basic Next.js pages: Home, Watch, Upload
- [ ] HLS.js player integration
- [ ] Video card component with thumbnail

### Phase 2 — Features (Weeks 4–6)
- [ ] Bull queue for async transcoding jobs
- [ ] Upload progress bar + status polling
- [ ] Search with Fuse.js (title + tags)
- [ ] Comments system
- [ ] Like / Unlike toggle
- [ ] Watch history tracking
- [ ] User profile pages
- [ ] Responsive Tailwind UI polish

### Phase 3 — Advanced (Weeks 7–8)
- [ ] Thumbnail seek preview (hover on progress bar)
- [ ] Recommendations (related videos by tags)
- [ ] Admin dashboard (manage all videos/users)
- [ ] Video edit (title, description, thumbnail)
- [ ] Bulk delete & storage usage stats
- [ ] Error handling & retry for failed transcodes

---

## 13. Setup & Installation

### Prerequisites

- Node.js >= 18
- pnpm >= 8 (`npm install -g pnpm`)
- Redis (local): `brew install redis` / `sudo apt install redis`
- FFmpeg: `brew install ffmpeg` / `sudo apt install ffmpeg`

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/yourname/streamlocal.git
cd streamlocal

# 2. Install all dependencies
pnpm install

# 3. Copy environment file
cp .env.example .env

# 4. Create storage directories
mkdir -p storage/uploads storage/videos storage/thumbnails storage/avatars
mkdir -p data
echo '{"users":[]}' > data/users.json
echo '{"videos":[]}' > data/videos.json
echo '{"comments":[]}' > data/comments.json
echo '{"likes":[],"watchHistory":[]}' > data/interactions.json

# 5. Start Redis (in a separate terminal)
redis-server

# 6. Start the API server
pnpm --filter api dev

# 7. Start the Next.js frontend (in a separate terminal)
pnpm --filter web dev

# 8. Open in browser
open http://localhost:3000
```

---

## 14. Folder Conventions & Naming

| Item              | Convention                    | Example                         |
|-------------------|-------------------------------|---------------------------------|
| Video IDs         | UUID v4                       | `a1b2c3d4-...`                  |
| HLS output folder | `/storage/videos/{videoId}/`  | `/storage/videos/a1b2c3d4/`     |
| Segment files     | `segment_NNN.ts`              | `segment_001.ts`                |
| Thumbnail files   | `{videoId}.jpg`               | `a1b2c3d4.jpg`                  |
| API routes        | kebab-case                    | `/api/videos/:id/status`        |
| React components  | PascalCase                    | `VideoCard.tsx`                 |
| Utility files     | camelCase                     | `ffmpeg.service.ts`             |
| JSON DB keys      | camelCase arrays              | `"videos": []`                  |

---

*This spec covers everything needed to build StreamLocal end-to-end with zero cloud dependency. All storage, processing, and serving happens on your local machine.*