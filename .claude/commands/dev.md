# Start Development Servers

Start both the API and frontend development servers.

## Steps

1. Check if Redis is running (for Bull queue). If not, warn but continue — the queue will fall back to direct processing.
2. Run `pnpm dev` from the project root to start both servers concurrently:
   - API server: http://localhost:4000
   - Web frontend: http://localhost:3000
3. Confirm both servers started by checking the output.

## Notes
- The API server uses `tsx watch` for hot-reload
- The Next.js frontend has built-in hot-reload
- API proxy is configured in `next.config.js` — frontend calls to `/api/*` and `/stream/*` are proxied to the API server
