# Add Frontend Page

Create a new Next.js page following the project's established patterns.

## Arguments
- `$ARGUMENTS` — Description of the new page (e.g., "settings page at /settings for editing user profile")

## Steps

1. Parse the page description from `$ARGUMENTS` to determine:
   - Route path (maps to folder structure under `apps/web/app/`)
   - Whether it needs authentication
   - What data it fetches
   - Key UI elements

2. Create the page directory and `page.tsx` file under `apps/web/app/`

3. Follow this page template pattern:
   ```typescript
   "use client";

   import { useEffect } from "react";
   // ... imports

   export default function PageName() {
     // Auth check if needed
     // Data fetching with loading/error/empty states
     // Return JSX with dark theme Tailwind classes
   }
   ```

4. If the page needs new components, create them in `apps/web/components/`

5. If the page needs new API calls, add them to the relevant hook in `apps/web/hooks/`

6. Run `pnpm --filter web build` to verify no build errors.

## Agent
Use the **ui-builder** agent for implementation.
