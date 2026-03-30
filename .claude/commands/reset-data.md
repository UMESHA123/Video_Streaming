# Reset Data

Reset all JSON database files to their initial empty state.

## WARNING
This will delete all users, videos, comments, and interactions data. Video files in `/storage/` are NOT deleted.

## Steps

1. **Confirm** with the user before proceeding — this is destructive
2. Reset data files:
   - `data/users.json` → `[]`
   - `data/videos.json` → `[]`
   - `data/comments.json` → `[]`
   - `data/interactions.json` → `{"likes":[],"watchHistory":[]}`
3. Optionally ask if the user also wants to clear `/storage/videos/`, `/storage/thumbnails/`, and `/storage/uploads/`
4. Confirm completion
