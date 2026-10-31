# Ed-Tech Learning Platform

Full-stack LMS: Super Admin, Admin, Moderator, Teacher and Student. Admins manage courses (categories, course
types, curriculum sections and lectures, bulk edits and discounts), teachers, users, homepage showcase posts and
the site logo. Students browse the public catalog, enrol in courses, learn through the course player (lectures,
study curricula, study materials, announcements, course Q&A), take quiz banks and practice quizzes, and buy
subscription plans. Everyone signed in gets 1-to-1 support chat with staff, group chat channels, notifications,
a study schedule (timers and reminders) and the public Community Hub (posts, replies, reactions, badges, points).
Super Admins also see a dashboard and performance reports.

Source of truth: the user's instructions (in conversation) and this file.

## Layout

- backend/ Express 5 + TypeScript + Mongoose + MongoDB, Socket.io, Cloudinary. **Its structure and patterns
  stay as they are** (see .claude/rules/backend.md). Deployed on Render (render.yaml).
- frontend/ Next.js (App Router) + TypeScript + MUI v9 + TanStack Query + i18next (mobile responsive).
  Deployed on Vercel (deploy hook in .github/workflows/deploy.yml).
- legacy-frontend/ the old React 19 + Vite client while pages are migrated (Stage A only; deleted at the end).
- docker/ dev + test compose files and Dockerfiles. Root compose.yml includes docker/compose.dev.yml.
- docs/ architecture, backend-features, frontend-features (by hand), database + dependency graph (generated).

## Commands (from the root)

- npm run dev: mongo + backend in Docker, Next.js on the host. Stop: Ctrl+C, then `npm run dev:down`.
  Ports (env overrides): frontend 3000 (FRONTEND_PORT), backend 5000 (BACKEND_PORT), Docker MongoDB on host
  port 27018 (MONGO_PORT; a local mongod already uses 27017). The dev database `edtech` starts empty.
  backend/.env is optional; MONGO_URI, PORT and CLIENT_URL are overridden to use the local stack.
- npm run test:backend: Vitest + Supertest against the mongo-test container
- npm run test:frontend: Vitest + React Testing Library + MSW
- npm run test:e2e: Playwright (desktop AND mobile)
- npm run lint / npm run typecheck: both apps (+ dependency-cruiser)
- npm run docs:generate / docs:check
- npm run check: lint + typecheck + format:check + docs:check + all tests + docker build. Must pass
  before every commit.
- "It needs Docker" is never a reason to skip a test: check `docker info`, start Docker Desktop, run it.
- Per app (also used by CI): `npm --prefix backend run build|lint|lint:fix`,
  `npm --prefix backend run seed:discount-courses|seed:subscriptions`.
- Port conflict (`EADDRINUSE :5000`) from a backend left running on the host:
  `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000 -State Listen).OwningProcess -Force`

## Backend (existing patterns, keep them)

- `src/app.ts`: Express setup (CORS: CLIENT_URL in production, any localhost port in dev, credentials on),
  json, urlencoded, cookie-parser, `/api` routes, notFound, errorHandler. `src/server.ts`: HTTP server,
  Socket.io init, DB connection.
- `src/routes/index.ts` mounts the 24 feature route files under `/api` (health, auth, users, teachers,
  categories, course-types, courses, announcements, study-curricula, study-materials, subscriptions,
  subscription-plans, enrollments, performance, qa, dashboard, chat, notifications, quiz-bank, quiz-sections,
  home-hero-posts, community, group-chat, study-schedules). Public health check: `GET /api/health`.
- Controllers: `src/controllers/<feature>.controller.ts` (camelCase), every async handler wrapped in
  `asyncHandler()`, errors via `throw new AppError(message, statusCode)` (global errorHandler).
- Models: `src/models/<Entity>.model.ts` (PascalCase), Mongoose schemas with timestamps and indexes.
- Middleware: `auth.middleware.ts` (`protect`, `optionalProtect`, `authorize(...roles)`),
  `upload.middleware.ts` (Multer memory storage: `upload` = images <= 5 MB, `uploadAnyFile` = <= 10 MB x 10),
  files then go to Cloudinary (`config/cloudinary.ts`). `errorHandler.ts`, `notFound.ts`.
- `src/socket/index.ts`: Socket.io with JWT auth (`handshake.auth.token` or the `token` cookie); rooms
  `user:<id>`, `staff`, `conv:<id>`, `group:<id>`; events `chat:*` and `groupChat:*`.
- `src/config/`: db, cloudinary, env (`config` object). `src/utils/`: AppError, asyncHandler, jwt.
- Response shape: `{ success: boolean; message?: string; data?: T; total?: number; page?: number; limit?: number }`.
- Auth flow: login/register issue a JWT (`JWT_EXPIRE`, default 7d), set it as the httpOnly `token` cookie
  (production: `secure`, `sameSite=none`) and also return it in the body. `protect` reads the cookie first,
  then `Authorization: Bearer`.
- Env names (never read .env files): NODE_ENV, PORT=5000, MONGO_URI, JWT_SECRET, JWT_EXPIRE, CLIENT_URL,
  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
- Subscriptions: no payment gateway yet. `POST /api/subscriptions/subscribe` activates the plan at once
  (price taken from SubscriptionPlanConfig). A gateway will be added later (Stage B).

## Frontend architecture (Next.js)

- Folders by layer (frontend/src): app/ (routes only: thin page.tsx / layout.tsx), api/ (<feature>.api.ts:
  request wrappers + TanStack Query hooks; query-client.ts), services/http.service.ts (the ONE axios client:
  unwraps { success, data }, turns every failure into an ApiError with a user-ready message), schemas/
  (Zod schemas matching the backend's real request/response shapes), components/<feature>/ (layout/ =
  shells, common/ = building blocks), hooks/, context/ (only real UI-wide state: chat socket, notifications),
  types/index.ts, utils/, theme/, i18n/. Tests in `__tests__/` next to the code.
- Components never call axios and never need try/catch: they use the api hooks.
- Same URLs as before: public pages, /auth/login, /auth/register, `/admin/*` (Super Admin, Admin, Moderator;
  some pages narrower), `/student/*`, `/teacher/*`.
- Auth: requests go to same-origin `/api/*` (next.config rewrites to the backend), so the httpOnly cookie is
  first-party and sent automatically; the token is never stored in localStorage or URLs. Socket.io connects
  to NEXT_PUBLIC_SOCKET_URL; its token comes from a Next.js route handler that reads the cookie on the server
  and is kept in memory only.
- i18n: English (`en`) and Bangla (`bn`), the same keys as the old client.
- Layer direction is enforced by dependency-cruiser.

## Code rules

- TypeScript strict. No `any`, no `@ts-ignore`, no non-null `!` without a comment.
- Max 1000 lines per file (post-edit hook + ESLint). Aim for < 300. Functions < 60 lines. A file over the
  limit is split into focused modules re-exported from an index file.
- One React component per file. Components with props declare a named `interface` and are typed
  `FC<Props>`; components without props are plain arrow functions (never a bare `FC`).
- No magic numbers, no console.log (ESLint no-console), no commented-out code, no TODO without an issue.
  Consistent type imports, no unused imports (ESLint in both apps).
- Naming: camelCase variables/functions, PascalCase types/components, kebab-case route folders, UPPER_SNAKE constants.
  Frontend services/api files camelCase or kebab-case `<feature>.api.ts`; components `PascalCase.tsx`.
- Dates: Luxon helpers in utils/dateTime; shown in the viewer's own (browser) time zone; the backend stores UTC.
- NEVER run git merge, rebase, reset or force-push, and NEVER create, switch or delete branches: the user does
  that. Since 2026-10-29 (user's decision) Claude commits each finished, fully checked step itself on the
  current branch and pushes it to its origin branch (a push runs deploy.yml).
- "The changes" = everything not committed yet (`git diff HEAD` + untracked files). The user commits after
  each feature, so agent reviews cover only the current feature.

## UI rules (see .claude/rules/frontend-ui.md)

Mobile first (360 / 768 / 1280 px), shared ResponsiveDataView, AppModal + useModal, useConfirm,
useDeleteConfirm, <Can> / <RequireRole>, no hard-coded text (i18n keys).

## Testing rules (see .claude/rules/testing.md)

- Every new endpoint: integration tests (success, 400, 401, 403 per role, 404, business rules). Every new
  page: component tests + a Playwright flow (desktop + mobile).
- **Definition of done for EVERY change** (run by Claude, never left to the user):
  1. `npm run lint` and `npm run typecheck` clean (0 errors, 0 warnings); `npm run docs:check` up to date.
  2. Tests for what changed added/updated and PASSING: backend -> `npm run test:backend`; frontend ->
     `npm run test:frontend` AND `npm run test:e2e`.
  3. Review: `test-engineer` and `code-reviewer` agents (plus `security-auditor` for backend, auth, payments,
     uploads or roles). Fix every Critical/High/Major finding yourself (backend: smallest change in the
     existing style, never a restructure), re-run tests. Save reports to `.claude/reports/` and show a summary table.
  4. Docs updated (documentation rules).
  5. Final message lists each check with its real result. Never "done" while a check failed or did not run.
- Until the root scripts exist (Stage A, Phases 2-5), run what exists: `npm --prefix backend run build`,
  `npm --prefix backend run lint`, and the same two for the frontend app.

## Documentation rules (see .claude/rules/documentation.md)

Endpoints in docs/backend-features.md, screens in docs/frontend-features.md, docs/architecture.md per
feature; database.md and dependency-graph.md are generated. Only what is implemented.

## Current status

- Stage A (conversion), following EdTech-Claude-Code-Setup-Guide.md.
- Done: Phase 0 (audit + decisions), Phase 1 (AI workspace: this file, .claude/ settings, hook, rules,
  agents, skills, reports folder, memory), Phase 2 (root tooling: root package.json, Prettier, husky +
  lint-staged, dependency-cruiser; backend Vitest + Supertest setup in backend/vitest.config.mts and
  backend/tests/setup.ts), Phase 3 (Docker: compose.yml, docker/compose.dev.yml, docker/compose.test.yml,
  docker/backend.Dockerfile with dev + prod stages, scripts/dev.mjs, scripts/docker-test.mjs), Phase 4
  (old client moved to legacy-frontend/; Next.js 16 skeleton in frontend/: providers, http.service + Zod-checked
  responses, TanStack Query, MUI theme, i18n en/bn, /auth/login + /auth/register, Admin/Student/Teacher shells
  with role-filtered menus, RequireRole/Can, proxy.ts sign-in redirect + per-request nonce CSP).
- Frontend hosting is Vercel, so there is no frontend Dockerfile; `docker:build` builds the backend prod image.
  A production `next build` needs BACKEND_INTERNAL_URL and NEXT_PUBLIC_SOCKET_URL (it fails without them).
- Pages not migrated yet (wave 3: chat, group chat, notifications, community hub, practice quiz, schedule) 404.
- Accepted for Stage A: browser-tab titles (metadata) are English only (language is picked in the browser).
- Phase 5 done: CI (.github/workflows/ci.yml: checks incl. docs, audits and gitleaks; backend + frontend
  lint/build; Docker test jobs; Node from .nvmrc), frontend Vitest + RTL + MSW (src/test/), Playwright
  (desktop + Pixel 7, e2e/ with global-setup warm-up), E2E accounts seeded by backend/tests/e2e/seed.ts
  (one per role, test database only). Backend `npm audit fix` (lockfile only): 0 vulnerabilities.
- Phase 6 done: docs/architecture.md, backend-features.md, frontend-features.md,
  generated database.md + dependency-graph.md (scripts/docs/), `npm run docs:check` in CI and `check`.
- Phase 7 done: integration tests for every backend endpoint (49 files, 1201 tests incl. Socket.io), every
  endpoint documented in docs/backend-features.md (177 routes), architecture.md feature map + flows. Shared
  test helpers: backend/tests/factories, backend/tests/helpers/cloudinary.ts. Agent reviews in baseline mode;
  every Critical/High/Major fixed in the existing style (new small utils: courseAccess, escapeRegex, fileType,
  loginThrottle). Reports: .claude/reports/2026-10-29-phase7-* and 2026-10-30-phase7-* (git-ignored).
- Backend rules added in Phase 7 (the frontend must follow them): course content (videos of non-preview
  lectures, materials, live-class links, quizzes, announcements, Q&A) only for staff, the course's teachers and
  enrolled students (subscription enrolments only while the plan covers the course); quiz answers are removed
  from unanswered questions, a question can be answered once per attempt (409; reset to retry), guests check
  free-preview answers with POST /api/quiz-bank/public/:id/questions/:qId/check; changing the email needs the
  current password; passwords 6-72 chars; only a Super Admin manages Admin/Super Admin accounts; at least one
  Super Admin remains; a course with enrolments cannot be deleted (unpublish instead); uploads are checked by
  content (images: PNG/JPEG/GIF/WEBP); 10 wrong passwords lock an email for 15 minutes (429).
- Open decisions for the user: per-IP rate limiting (needs express-rate-limit + the real proxy hop count;
  today the login lock is per email); the deploy workflow deploys every branch without waiting for CI; seed
  scripts now need SEED_ADMIN_PASSWORD / SEED_STUDENT_PASSWORD.
- Existing lint warnings (not errors): backend 4 (legacy-frontend/ is no longer linted).
- Phase 8 in progress: wave 1 (public site, catalog, course page, student area, profile, course setup,
  showcase) and wave 2 (admin courses + bulk edit + enrolments, course editor, course player, users,
  teachers, subscriptions, course Q&A, teacher courses, dashboard, performance) migrated. Shared blocks:
  frontend/src/components/common (AppModal, ResponsiveDataView, SafeHtml, ...), course-card/, api/catalog.api,
  hooks useModal/useConfirm/useUrlListParams, utils/dateTime|price|urls|sanitizeHtml, per-feature locales
  src/i18n/locales/<lang>/<feature>.json. Next: wave 3 (chat + group chat + notifications with the socket
  token route, community hub, practice quiz, study schedule), then Phase 9.
- Known follow-up (Stage B): payment gateway; until then subscribing activates the plan without payment.
