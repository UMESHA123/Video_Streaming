# Add API Route

Create a new API endpoint following the project's established patterns.

## Arguments
- `$ARGUMENTS` — Description of the new route (e.g., "GET /api/videos/:id/related - get related videos by tags")

## Steps

1. Parse the route description from `$ARGUMENTS` to determine:
   - HTTP method (GET, POST, PATCH, DELETE)
   - URL path
   - Whether authentication is required
   - Purpose/behavior

2. Determine which controller file to add the handler to (or create new one if needed):
   - `apps/api/src/controllers/*.controller.ts`

3. Create the controller function following this pattern:
   ```typescript
   export function handlerName(
     req: Request,
     res: Response,
     next: NextFunction
   ): void {
     try {
       // ... logic
       res.json({ ... });
     } catch (err) {
       next(err);
     }
   }
   ```

4. Register the route in the appropriate routes file:
   - `apps/api/src/routes/*.routes.ts`
   - Apply `authenticate` middleware if auth is required
   - Apply `optionalAuth` if auth is optional

5. If the route requires a new routes file, register it in `apps/api/src/index.ts`

6. Run `pnpm --filter api build` to verify no TypeScript errors.

## Agent
Use the **api-builder** agent for implementation.
