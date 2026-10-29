---
paths:
  - '**/*.test.{ts,tsx}'
  - 'frontend/e2e/**'
  - 'backend/tests/**'
---

# Testing rules

## Run the tests yourself, every change

- Every change ends with the tests RUN and PASSING, not only written (CLAUDE.md "Definition of done"):
  `npm run test:backend`, `npm run test:frontend`, `npm run test:e2e`, `npm run check`.
- Never skip a suite because "it needs Docker": check `docker info` and run it. If it truly cannot run, say so,
  do not call the task done, and give the user the exact command.

## Conventions

- Backend: Vitest + Supertest against the real mongo-test container (tmpfs, wiped every run). Tests import the
  Express app from backend/src/app.ts (no server start) and connect Mongoose in tests/setup.ts. Do not mock
  Mongoose. Collections cleared before each test file. Factories in backend/tests/factories.
- Every endpoint test: happy path, 400 validation, 401 not signed in, 403 per role without access, 404, and
  every business rule (a student cannot open a lesson of a course they are not enrolled in; a teacher cannot
  edit another teacher's course; ...).
- Auth in tests: sign in through the real login endpoint or create a token with the backend's own
  utils/jwt.ts; send it as the `token` cookie (what the Next.js app uses) and cover the Bearer header once.
- A backend test that fails because the EXISTING code is wrong: keep the test, fix the bug in the backend
  (smallest change, existing style), re-run until green, and list the fix in the summary. Never weaken the test.
- External services (Cloudinary, email, payment) mocked at the HTTP boundary, never in app code.
- Frontend: Vitest + React Testing Library + MSW handlers built from src/schemas.
- E2E: Playwright projects 'desktop' (1280x800) and 'mobile' (Pixel 7) against the Docker stack with seeded data.
- Deterministic: no real network, no sleeps; fake timers and seeded data; dates tested in a fixed time zone.
- File names: backend/tests/integration/<feature>.<action>.test.ts, ComponentName.test.tsx, e2e/<feature>.spec.ts.
