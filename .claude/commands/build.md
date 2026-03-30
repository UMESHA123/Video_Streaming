# Build Project

Build both the API and frontend for production.

## Steps

1. Run `pnpm --filter api build` to compile TypeScript to `apps/api/dist/`
2. Run `pnpm --filter web build` to create optimized Next.js production build in `apps/web/.next/`
3. Report any build errors with file locations and suggested fixes.

## Build Verification
- API: Check that `apps/api/dist/` contains compiled JS files
- Web: Check the build output shows all routes compiled successfully
