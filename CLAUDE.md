# StreamLocal — Claude Code Project Guide

## Project Overview
StreamLocal is a fully local video streaming platform. Videos are uploaded, transcoded to HLS (adaptive bitrate) via FFmpeg, and streamed from the local filesystem. No cloud dependency.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + HLS.js
- **Backend**: Express.js + TypeScript (ES module)
- **Database**: JSON flat files (`/data/*.json`)
- **Video**: FFmpeg transcoding, Bull+Redis queue (with direct-process fallback)
- **Auth**: JWT (stateless, stored in localStorage)
- **Package Manager**: pnpm (monorepo workspace)

## Project Structure
```
streamlocal/
├── apps/
│   ├── api/                    # Express.js backend (port 4000)
│   │   └── src/
│   │       ├── index.ts        # Entry point
│   │       ├── config/         # paths.ts, ffmpeg.ts
│   │       ├── controllers/    # Request handlers
│   │       ├── routes/         # Route definitions
│   │       ├── services/       # Business logic (ffmpeg, queue, search, storage)
│   │       ├── middleware/     # auth, upload, error
│   │       └── db/             # db.ts (read/write), schema.ts (types)
│   └── web/                    # Next.js frontend (port 3000)
│       ├── app/                # Pages (App Router)
│       ├── components/         # React components
│       ├── hooks/              # Custom hooks (useAuth, useVideo)
│       └── lib/                # api.ts (Axios), auth.ts (JWT helpers)
├── storage/                    # Local file storage
│   ├── uploads/                # Raw uploads (temp, deleted after transcode)
│   ├── videos/{id}/            # HLS output (master.m3u8 + quality dirs)
│   ├── thumbnails/             # {videoId}.jpg
│   └── avatars/                # {userId}.jpg
├── data/                       # JSON database
│   ├── users.json, videos.json, comments.json, interactions.json
├── SPEC.md                     # Full project specification
└── .env                        # Environment variables
```

## Key Commands
```bash
pnpm dev              # Start both API + Web dev servers
pnpm dev:api          # Start API only
pnpm dev:web          # Start frontend only
pnpm build            # Build frontend for production
pnpm build:api        # Build API (TypeScript compile)
pnpm lint             # Lint all packages
```

## API Routes Summary
| Prefix           | File                         | Auth Middleware     |
|------------------|------------------------------|---------------------|
| `/api/auth`      | auth.routes.ts               | None / `authenticate` |
| `/api/videos`    | video.routes.ts              | `optionalAuth` / `authenticate` |
| `/api/stream`    | stream.routes.ts             | None                |
| `/api/users`     | user.routes.ts               | None / `authenticate` |
| `/api/comments`  | comment.routes.ts            | None / `authenticate` |

## Coding Conventions

### Backend (Express.js)
- ES module imports with `.js` extensions (required by NodeNext)
- Controllers: `(req, res, next) => void` pattern, try/catch with `next(err)`
- Errors: `createError(statusCode, message)` from error middleware
- IDs: UUID v4 via `uuid` package
- DB: `readX()` / `writeX()` — synchronous JSON read-modify-write
- Never expose `passwordHash` in responses

### Frontend (Next.js)
- `"use client"` directive on all interactive components
- `@/` path alias for imports
- Tailwind dark theme: `surface-*`, `brand`, `btn-*`, `input-dark`, `card-dark`
- Icons: `lucide-react`
- API calls: `@/lib/api` Axios instance (auto-attaches JWT)
- Always handle loading + error + empty states

### Naming
- Components: PascalCase (`VideoCard.tsx`)
- Hooks: camelCase with `use` prefix (`useVideo.ts`)
- Routes: kebab-case (`video.routes.ts`)
- IDs: UUID v4

---

## Custom Agents

Use these agents when working on specific areas of the codebase:

| Agent | File | Use For |
|-------|------|---------|
| **api-builder** | `.claude/agents/api-builder.md` | Building/modifying Express.js API endpoints, controllers, routes |
| **ui-builder** | `.claude/agents/ui-builder.md` | Building/modifying Next.js pages, React components, styling |
| **video-pipeline** | `.claude/agents/video-pipeline.md` | FFmpeg transcoding, HLS streaming, queue, storage |
| **db-manager** | `.claude/agents/db-manager.md` | JSON database operations, schema changes, data integrity |

## Custom Commands

| Command | Description |
|---------|-------------|
| `/dev` | Start development servers |
| `/build` | Build both API and frontend |
| `/add-route` | Scaffold a new API endpoint |
| `/add-page` | Scaffold a new Next.js page |
| `/add-component` | Scaffold a new React component |
| `/check-health` | Run project health checks |
| `/reset-data` | Reset all JSON data files to empty state |

## Agent Usage Tags

When to use each agent:

- **Working on `apps/api/src/`** → Use `api-builder` agent
- **Working on `apps/web/`** → Use `ui-builder` agent
- **Working on FFmpeg, HLS, transcoding, `/storage/`** → Use `video-pipeline` agent
- **Working on `data/*.json`, `apps/api/src/db/`** → Use `db-manager` agent

## Environment
- `.env` at project root: API_PORT, JWT_SECRET, Redis config, FFmpeg paths
- `apps/web/.env.local`: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_STREAM_URL
- Redis is optional — queue falls back to direct processing
- FFmpeg must be installed locally (`brew install ffmpeg`)
