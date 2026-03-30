# StreamLocal - Local Video Streaming Platform

A fully local video streaming platform built with **Next.js** and **Express.js**. Upload, transcode, and stream videos using adaptive bitrate HLS — all without any cloud dependency.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwindcss&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-HLS_Transcoding-007808?logo=ffmpeg&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Features

- **Video Upload & Transcoding** — Upload any video format; FFmpeg transcodes to 4 quality levels (360p, 480p, 720p, 1080p)
- **HLS Adaptive Bitrate Streaming** — Player auto-adjusts quality based on network conditions
- **Async Job Queue** — Bull + Redis queue for background transcoding with direct-process fallback
- **JWT Authentication** — Secure stateless auth with register, login, and protected routes
- **Fuzzy Search** — Search videos by title and tags using Fuse.js
- **Comments & Likes** — Full social interaction system per video
- **User Profiles** — Profile pages with avatar upload and video listings
- **Watch History** — Track viewing progress per user
- **Thumbnail Extraction** — Auto-generated thumbnails from uploaded videos
- **Dark Theme UI** — Responsive, modern interface built with Tailwind CSS
- **Zero Cloud Dependency** — Everything runs locally on your machine

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   BROWSER / CLIENT                   │
│              Next.js App (localhost:3000)             │
│     Pages (App Router)  │  HLS.js Player  │  Axios   │
└────────────┬────────────┴───────┬─────────┴────┬─────┘
             │               HLS stream       REST API
             │             (m3u8 + .ts)     (JSON responses)
┌────────────┴────────────────────┴──────────────┴─────┐
│           EXPRESS.JS API (localhost:4000)             │
│                                                      │
│   Routes: /api/auth  /api/videos  /api/stream        │
│           /api/users  /api/comments                  │
│                      │                               │
│        ┌─────────────┼──────────────┐                │
│   ┌────┴────┐  ┌─────┴───┐  ┌──────┴──────┐         │
│   │  JSON   │  │ FFmpeg  │  │  Bull Queue │         │
│   │  DB     │  │ Service │  │  (Redis)    │         │
│   └────┬────┘  └─────┬───┘  └─────────────┘         │
│        └─────────────┴───────────────┐               │
│              LOCAL FILE SYSTEM                        │
│   /storage/videos/  /storage/thumbnails/  /data/     │
└──────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14 (App Router) | UI, routing, SSR/CSR pages |
| Styling | Tailwind CSS | Utility-first responsive design |
| Video Player | HLS.js | Adaptive bitrate playback |
| Icons | Lucide React | UI icons |
| Backend API | Express.js + TypeScript | REST API server |
| Video Processing | FFmpeg | Transcoding & HLS segmentation |
| Job Queue | Bull + Redis | Async transcoding jobs |
| Search | Fuse.js | In-memory fuzzy search |
| Database | JSON flat files (lowdb) | Metadata persistence |
| Auth | JWT (jsonwebtoken) | Stateless authentication |
| File Upload | Multer | Multipart file handling |
| Package Manager | pnpm | Monorepo workspaces |

---

## Project Structure

```
streamlocal/
├── apps/
│   ├── api/                        # Express.js backend (port 4000)
│   │   └── src/
│   │       ├── index.ts            # Entry point
│   │       ├── config/             # paths.ts, ffmpeg.ts
│   │       ├── controllers/        # auth, video, stream, user, comment
│   │       ├── routes/             # Route definitions
│   │       ├── services/           # ffmpeg, queue, search, storage
│   │       ├── middleware/         # auth, upload, error handling
│   │       └── db/                 # JSON database (lowdb)
│   │
│   └── web/                        # Next.js frontend (port 3000)
│       ├── app/                    # Pages (App Router)
│       │   ├── page.tsx            # Home / video feed
│       │   ├── watch/[id]/         # Video watch page
│       │   ├── upload/             # Upload page
│       │   ├── search/             # Search results
│       │   ├── profile/[username]/ # User profile
│       │   └── auth/               # Login & Register
│       ├── components/             # VideoCard, VideoPlayer, Navbar, etc.
│       ├── hooks/                  # useAuth, useVideo
│       └── lib/                    # API client (Axios), auth helpers
│
├── storage/                        # Local file storage
│   ├── uploads/                    # Raw uploads (temp, deleted after transcode)
│   ├── videos/{id}/                # HLS output (master.m3u8 + quality dirs)
│   ├── thumbnails/                 # Auto-extracted thumbnails
│   └── avatars/                    # User profile images
│
├── data/                           # JSON flat-file database
│   ├── users.json
│   ├── videos.json
│   ├── comments.json
│   └── interactions.json
│
├── docker-compose.yml              # Redis/RabbitMQ services
├── pnpm-workspace.yaml
└── package.json
```

---

## Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8 — `npm install -g pnpm`
- **FFmpeg** — `brew install ffmpeg` (macOS) or `sudo apt install ffmpeg` (Linux)
- **Redis** (optional) — `brew install redis` (macOS) or `sudo apt install redis` (Linux)
  > Redis is optional. Without it, transcoding jobs run via direct processing fallback.

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/UMESHA123/Video_Streaming.git
cd Video_Streaming
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```env
# Server
API_PORT=4000
WEB_PORT=3000

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Storage
STORAGE_DIR=./storage
DATA_DIR=./data

# Redis (optional — queue falls back to direct processing)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# FFmpeg (leave blank if already in PATH)
FFMPEG_PATH=
FFPROBE_PATH=

# Upload limits
MAX_UPLOAD_SIZE_GB=10
```

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_STREAM_URL=http://localhost:4000/stream
```

### 4. Create storage directories

```bash
mkdir -p storage/uploads storage/videos storage/thumbnails storage/avatars
```

### 5. Start development servers

```bash
# Start both API and frontend
pnpm dev

# Or start individually
pnpm dev:api    # API on http://localhost:4000
pnpm dev:web    # Frontend on http://localhost:3000
```

### 6. Open in browser

Navigate to **http://localhost:3000**

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start both API + Web dev servers |
| `pnpm dev:api` | Start API server only |
| `pnpm dev:web` | Start frontend only |
| `pnpm build` | Build frontend for production |
| `pnpm build:api` | Compile API TypeScript |
| `pnpm lint` | Lint all packages |

---

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Create new account |
| POST | `/login` | No | Login, receive JWT |
| POST | `/logout` | Yes | Invalidate token |
| GET | `/me` | Yes | Get current user |

### Videos — `/api/videos`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | No | List videos (paginated) |
| POST | `/upload` | Yes | Upload video (multipart) |
| GET | `/:id` | No | Get video metadata |
| GET | `/:id/status` | No | Poll processing status |
| DELETE | `/:id` | Yes | Delete video (owner only) |
| POST | `/:id/like` | Yes | Like a video |
| DELETE | `/:id/like` | Yes | Unlike a video |
| GET | `/search?q=` | No | Search by title/tags |

### Streaming — `/api/stream`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/:videoId/master.m3u8` | No | HLS master playlist |
| GET | `/:videoId/:quality/playlist.m3u8` | No | Quality-level playlist |
| GET | `/:videoId/:quality/:segment` | No | Individual .ts segment |

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/:username` | No | Public user profile |
| PATCH | `/me` | Yes | Update own profile |
| GET | `/me/history` | Yes | Watch history |
| GET | `/:username/videos` | No | User's videos |

### Comments — `/api/comments`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/:videoId` | No | Get video comments |
| POST | `/:videoId` | Yes | Post a comment |
| DELETE | `/:videoId/:commentId` | Yes | Delete own comment |

---

## Video Processing Pipeline

```
Upload → Multer saves raw file → DB record (status: "uploading")
    → Bull queue job (status: "processing")
    → FFmpeg transcodes to 4 quality levels (HLS)
    → Thumbnail extracted
    → DB updated (status: "ready")
    → Raw upload deleted
    → Video available for streaming
```

**Quality Levels:**

| Quality | Resolution | Bitrate |
|---|---|---|
| 1080p | 1920x1080 | 4000 kbps |
| 720p | 1280x720 | 2500 kbps |
| 480p | 854x480 | 1000 kbps |
| 360p | 640x360 | 500 kbps |

---

## Database Schema

The app uses JSON flat files for storage (via lowdb):

- **`data/users.json`** — User accounts (id, username, email, passwordHash, avatar, bio)
- **`data/videos.json`** — Video metadata (id, title, status, duration, HLS URL, views, likes, tags)
- **`data/comments.json`** — Comments (id, videoId, userId, text)
- **`data/interactions.json`** — Likes and watch history

---

## Docker (Optional)

A `docker-compose.yml` is included for running Redis/RabbitMQ:

```bash
docker-compose up -d
```

---

## License

This project is open source and available under the [MIT License](LICENSE).
