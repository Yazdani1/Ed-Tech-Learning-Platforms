# Backend Testing Workflow

This backend test suite uses Jest for the test runner, assertions, mocks, setup/teardown, and coverage. Supertest drives the Express API directly through `src/app.ts`, so tests do not need to open a real HTTP port.

## Stack

- `jest`: test runner and assertions
- `ts-jest`: TypeScript support for Jest
- `supertest`: API requests against the Express app
- `mongodb-memory-server`: isolated MongoDB instance for automated tests
- `cross-env`: portable `NODE_ENV=test` scripts on Windows and Unix
- `socket.io-client`: Socket.IO integration tests against the backend socket server

## Scripts

Run from `backend/`:

```powershell
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:coverage
npm run test:watch
npm run typecheck
```

## Folder Structure

```text
tests/
  setup/
    env.ts
    jest.setup.ts
    testDb.ts

  helpers/
    assertions.helper.ts
    auth.helper.ts
    data.helper.ts

  unit/
    config/
      cloudinary.test.ts
    middleware/
      errorHandler.test.ts
      notFound.test.ts
    utils/
      jwt.test.ts

  integration/
    admin/
      dashboard-performance.routes.test.ts
    auth/
      auth.routes.test.ts
    chat/
      chat.routes.test.ts
    community/
      community.routes.test.ts
    content/
      announcement-study.routes.test.ts
    courses/
      course-curriculum.routes.test.ts
      course.routes.test.ts
    coverage-edges/
      collaboration-quiz.edge.test.ts
      course-user.edge.test.ts
    enrollments/
      enrollment.routes.test.ts
    groupChat/
      groupChat.routes.test.ts
    health/
      health.routes.test.ts
    homeHero/
      homeHeroPost.routes.test.ts
    notifications/
      notification.routes.test.ts
    qa/
      qa.routes.test.ts
    quizzes/
      quiz.routes.test.ts
    security/
      protected-routes.test.ts
    socket/
      socket.test.ts
    studySchedule/
      studySchedule.routes.test.ts
    subscriptions/
      subscription.routes.test.ts
    taxonomy/
      category-course-type.routes.test.ts
    users/
      user.routes.test.ts
```

## Test Design Standard

Each API area should cover the meaningful production scenarios:

- success with valid data
- missing required fields
- wrong data shape or invalid enum values
- malformed ObjectIds
- valid ObjectIds that do not match records
- duplicate data where uniqueness matters
- unauthenticated requests
- authenticated but unauthorized role access
- empty result sets and filtered result sets
- external service success/failure through mocks

The `security/protected-routes.test.ts` file is a broad contract test for protected routes. Feature-specific suites then test deeper business behavior.

## Test Database

`tests/setup/testDb.ts` starts an in-memory MongoDB instance before the suite, clears all collections before each test, and disconnects at the end. This keeps tests isolated and avoids polluting local development data.

## Auth Helpers

`tests/helpers/auth.helper.ts` creates users with hashed passwords and generates real JWT bearer tokens with the same backend utility used by production code. Route tests should use:

```ts
const user = await createTestUser({ role: 'Admin' });
await request(app).get('/api/users').set(authHeaderFor(user));
```

## Cloudinary Strategy

Cloudinary is mocked globally in `tests/setup/jest.setup.ts`. Upload routes still exercise Multer validation and controller logic, but no real external upload or delete is performed. This keeps tests fast, deterministic, and safe for CI.

## Current Coverage

The current suite covers:

- health
- auth register/login/logout/current profile/profile update/avatar upload validation
- protected route authentication contract
- privileged route role contract
- users CRUD and admin permissions
- categories and course types
- courses list/browse/get/create/update/status/bulk/discount/delete
- course curriculum sections and lectures
- teachers
- enrollments and enrollment reporting/export
- subscription plans and subscriptions
- study schedule timers/reminders/update/delete
- announcements
- study curriculum and study materials
- quiz sections, quiz banks, questions, attempts, and public quiz previews
- Q&A questions, answers, resolution, upvotes, and staff overview
- notifications
- dashboard and performance reports
- home hero posts and site logo
- chat and group chat
- socket.io authentication, student/staff chat events, presence, and group typing
- community settings, channels, posts, replies, reactions, badges, and point rules
- deeper course/user edge cases for filters, bulk operations, image replacement, advanced user analytics, and cleanup paths
- JWT and Cloudinary adapter contracts

Verified latest run:

```text
npm test -- --runInBand
27 test suites passed
179 tests passed

npm run test:coverage -- --runInBand
Overall statements: 95.69%
Overall branches: 80.97%
Overall functions: 96.90%
Overall lines: 98.89%
```

The route files, models, shared middleware line coverage, and most API success/error paths are exercised. This is not yet 100% total backend coverage. Remaining non-100% coverage is concentrated in branch-heavy controller internals, socket connection behavior, environment-only branches, and deeper admin analytics/filter branches.

Highest remaining coverage targets:

- `src/controllers/community.controller.ts`
- `src/controllers/quizBank.controller.ts`
- `src/controllers/groupChat.controller.ts`
- `src/controllers/teacher.controller.ts`
- `src/controllers/user.controller.ts`
- `src/socket/index.ts`
- branch coverage in dashboard, performance, notification, enrollment, subscription, home hero, and environment-specific paths

## Adding A New API Test

1. Put the test under `tests/integration/<feature>/<feature>.routes.test.ts`.
2. Use helpers from `tests/helpers` instead of recreating auth or fixture setup.
3. Cover success, validation failure, auth failure, role failure, bad id, and not found scenarios.
4. Mock external services in setup or a dedicated `tests/mocks` file.
5. Keep assertions focused on public API behavior and important database side effects.
