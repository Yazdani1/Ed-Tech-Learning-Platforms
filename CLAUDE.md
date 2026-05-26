# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## After Every Feature Change

After completing any feature or fix, run all four checks before reporting the task as done. Fix any errors before finishing — do not skip or defer.

```bash
# 1. Backend — full build (compiles to dist/)
cd backend && npm run build

# 2. Backend — lint
cd backend && npm run lint

# 3. Frontend — full build (tsc + Vite bundle)
cd frontend && npm run build

# 4. Frontend — lint
cd frontend && npm run lint
```

If lint errors are auto-fixable, run `npm run lint:fix` first, then re-check. Only report the task complete when all four pass with no errors.

> `npm run dev` is a long-running server and cannot be used as a build check. `npm run build` covers everything it would catch at startup.

**Port conflict (`EADDRINUSE :5000`)** — a previous backend process is still running. Fix with:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000 -State Listen).OwningProcess -Force
```

## Dev Commands

**Frontend** (port 3000):
```bash
cd frontend
npm run dev        # start Vite dev server
npm run build      # tsc + vite build
npm run lint       # ESLint check
npm run lint:fix   # ESLint auto-fix
```

**Backend** (port 5000):
```bash
cd backend
npm run dev        # nodemon (watches src/, auto-restarts)
npm run build      # tsc → dist/
npm start          # node dist/server.js
npm run lint
npm run lint:fix
npm run seed:discount-courses
npm run seed:subscriptions
```

There is no test suite configured in this project.

## Architecture Overview

This is a full-stack MERN platform (Ed-Tech / LMS) with role-based access for Super Admin, Admin, Moderator, Teacher, and Student.

### Backend (`backend/src/`)

MVC pattern — Express 5 + Mongoose + TypeScript:

- `app.ts` — Express setup, middleware registration, route mounting
- `server.ts` — HTTP server entry point, Socket.io init, DB connection
- `routes/index.ts` — Aggregates all 22 feature route files
- `controllers/` — One file per domain (e.g. `course.controller.ts`)
- `models/` — Mongoose schemas named `<Entity>.model.ts`
- `middleware/` — `auth.ts` (JWT protect + authorize), `errorHandler.ts`, `upload.ts` (Multer)
- `utils/AppError.ts` — Custom error class; use this instead of throwing plain errors
- `utils/asyncHandler.ts` — Wraps async route handlers to forward errors
- `socket/index.ts` — Socket.io with JWT auth, room-based chat, presence tracking
- `config/` — DB, Cloudinary, env config

**API response shape:**
```ts
{ success: boolean; message?: string; data?: T; total?: number; page?: number; limit?: number }
```

**Auth flow:** JWT issued on login, stored as HTTP-only cookie and sent as Bearer token. `protect` middleware verifies the token; `authorize(...roles)` guards by role.

### Frontend (`frontend/src/`)

React 19 + React Router 7 + Material-UI v9 + Context API:

- `App.tsx` — All routes. Public, role-protected (`ProtectedRoute`), and layout-specific routes
- `context/` — `AuthContext` (user, isAuthenticated, login/logout/refreshUser), `ChatContext`, `NotificationContext`, `ConfirmModalContext`
- `services/api.ts` — Axios instance; base URL from `VITE_API_URL` env var; request interceptor injects `Authorization: Bearer`; response interceptor unwraps `data`, shows toast errors, redirects on 401 (silent for `/auth/me` and `/enrollments`)
- `services/<entity>.service.ts` — 21 domain service files, each exports a default object with `getAll`, `getById`, `create`, `update`, `delete` methods
- `pages/` — Grouped by role/feature; each folder maps to a layout
- `components/` — Grouped by feature (course, teacher, chat, home, layout, ui, common)
- `utils/` — dateTime (Luxon), duration, pricing, urlParams helpers
- `theme.ts` — MUI theme customization
- `i18n/` — i18next internationalization

**Route layout groups:**
- `/admin/*` → `AdminLayout` (Super Admin / Admin / Moderator only)
- `/student/*` → `StudentLayout`
- `/teacher/*` → `TeacherLayout`
- Public pages at root level

### State Management

Context API only — no Redux. Access auth state via the `useAuth()` hook. Real-time chat/notifications use Socket.io via `ChatProvider`.

### File Uploads

Multer handles multipart on the backend; files are stored to Cloudinary. The `upload` middleware is applied per-route.

### Path Alias

Frontend uses `@` as an alias for `src/` (configured in `tsconfig.json` and Vite).

## Environment Variables

**Backend** — copy `.env.example`:
```
NODE_ENV, PORT=5000, MONGO_URI, JWT_SECRET, JWT_EXPIRE, CLIENT_URL,
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
```

**Frontend:**
```
VITE_API_URL=http://localhost:5000/api
```

## Key Conventions

- **File size limit: 1000 lines max.** If a file exceeds this, split it into focused modules and re-export from an index file (e.g. `controllers/course/index.ts` re-exporting from `create.ts`, `update.ts`, etc.).
- Backend models: `PascalCase.model.ts`; controllers: `camelCase.controller.ts`
- Frontend services: `camelCase.service.ts`; components: `PascalCase.tsx`
- React components **with props** must declare a named `interface` and type as `FC<InterfaceName>`. Never use inline prop types. Example:
  ```tsx
  interface CourseCardProps {
    title: string;
    price: number;
  }
  const CourseCard: FC<CourseCardProps> = ({ title, price }) => { ... };
  ```
- React components **with no props** use a plain arrow function — do not annotate with bare `FC`:
  ```tsx
  const PracticeQuizPage = () => { ... };
  ```
- Throw `new AppError(message, statusCode)` in backend controllers — the global error handler catches it
- Wrap async controllers with `asyncHandler()`
- Frontend lazy-loads page components via `React.lazy()`
- ESLint enforces `no-console`, consistent type imports, and no unused imports in both packages
