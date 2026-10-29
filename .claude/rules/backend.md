---
paths:
  - 'backend/**'
---

# Backend rules: keep the existing patterns

- The backend's folder structure, patterns and response shape stay as they are. Never move, rename,
  refactor or restyle existing backend code (it has no Prettier; never reformat untouched lines).
- Bugs and security holes (found by tests or agents) are fixed without asking: the smallest change in the
  same file, same pattern and same response shape; a test proves the fix; each fix is listed in the summary.
  A fix that would need a restructure, a new library, another response shape or another auth method is
  explained to the user first.
- Otherwise, during Stage A (conversion) the only backend additions are tests (backend/tests/**) and test
  devDependencies/scripts in backend/package.json.
- New endpoints (Stage B) follow the existing pattern exactly:
  - model in src/models/<Entity>.model.ts (PascalCase), with indexes for every filter/sort field
  - controller functions in src/controllers/<feature>.controller.ts (camelCase), wrapped in asyncHandler(),
    errors via `new AppError(message, statusCode)`
  - routes in src/routes/<feature>.routes.ts with protect + authorize(...roles) from
    middleware/auth.middleware.ts (optionalProtect for public routes that personalise for signed-in users),
    mounted in routes/index.ts
  - static paths (e.g. `/reorder`, `/bulk`) are declared BEFORE parameter paths (`/:id`) in the same router
  - response shape { success, message?, data?, total?, page?, limit? }
  - uploads via the existing upload middleware (middleware/upload.middleware.ts: Multer memory storage ->
    Cloudinary)
  - copy the closest existing feature as the model; do not introduce new layers or libraries without asking.
- Validate input on every new endpoint (follow the existing validation approach: manual checks in the
  controller throwing AppError 400; ask the user before adding a validation library).
- Lists are paginated (page, limit; a sensible max), queries use .lean() and .select() where the existing code
  allows it; no queries inside loops.
- Never return password hashes, tokens or other users' private data. Never log secrets.
- After any endpoint change: tests + docs/backend-features.md in the same task.
