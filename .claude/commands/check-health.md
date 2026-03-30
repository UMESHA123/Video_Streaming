# Check Project Health

Run a comprehensive health check on the StreamLocal project.

## Steps

1. **Dependencies**: Run `pnpm install` and check for missing or outdated packages
2. **API Build**: Run `pnpm --filter api build` and report any TypeScript errors
3. **Web Build**: Run `pnpm --filter web build` and report any build errors
4. **Data Files**: Verify all JSON data files exist and contain valid JSON:
   - `data/users.json`
   - `data/videos.json`
   - `data/comments.json`
   - `data/interactions.json`
5. **Storage Dirs**: Verify all storage directories exist:
   - `storage/uploads/`
   - `storage/videos/`
   - `storage/thumbnails/`
   - `storage/avatars/`
6. **External Tools**: Check if FFmpeg and Redis are available on the system
7. **Report**: Summarize what passed and what needs attention
