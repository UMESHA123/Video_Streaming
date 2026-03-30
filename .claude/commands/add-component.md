# Add Component

Create a new React component following the project's established patterns.

## Arguments
- `$ARGUMENTS` — Description of the component (e.g., "VideoGrid - a responsive grid layout for video cards with pagination")

## Steps

1. Parse the component description from `$ARGUMENTS` to determine:
   - Component name (PascalCase)
   - Props interface
   - Behavior and interactivity

2. Create the component file at `apps/web/components/{ComponentName}.tsx`

3. Follow this component pattern:
   ```typescript
   "use client";  // Only if interactive

   import { ... } from "react";
   // ... other imports

   interface ComponentNameProps {
     // typed props
   }

   export default function ComponentName({ ... }: ComponentNameProps) {
     return (
       // JSX with Tailwind dark theme classes
     );
   }
   ```

4. Use existing design tokens: `surface-*` colors, `btn-*` classes, `input-dark`, `card-dark`

5. Use `lucide-react` for icons

6. Run `pnpm --filter web build` to verify.

## Agent
Use the **ui-builder** agent for implementation.
