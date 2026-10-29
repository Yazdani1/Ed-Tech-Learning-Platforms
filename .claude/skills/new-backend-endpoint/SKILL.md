---
name: new-backend-endpoint
description: Use when adding a NEW endpoint to backend/ (Stage B). Follows the backend's existing patterns, with tests and docs.
---

# New backend endpoint (existing patterns)

1. Find the closest existing feature (route + controller + model) and follow it exactly.
2. Model: new or extended `src/models/<Entity>.model.ts` with indexes (.claude/rules/database.md).
3. Controller: `src/controllers/<feature>.controller.ts`, functions wrapped in `asyncHandler()`, errors via
   `new AppError(message, statusCode)`, response `{ success, message?, data?, total?, page?, limit? }`.
4. Route: `src/routes/<feature>.routes.ts` with `protect` + `authorize(...roles)` from
   `middleware/auth.middleware.ts` (+ `upload` / `uploadAnyFile` from `middleware/upload.middleware.ts` if
   needed); static paths before `/:param` paths; mount in `routes/index.ts`.
5. Input validation the way the existing code does it (manual checks -> `AppError(..., 400)`).
6. Tests `backend/tests/integration/<feature>.<action>.test.ts`: success, 400, 401, 403 per role, 404, each rule.
7. Run `npm run test:backend`, `npm run lint`, `npm run typecheck`. Files < 1000 lines.
8. Update `docs/backend-features.md` (section + Endpoints row).
