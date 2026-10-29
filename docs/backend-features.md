# Backend features (API)

Plain-language reference for every backend endpoint. Screens that use them: [frontend-features.md](frontend-features.md).

## Conventions

| Topic         | Rule                                                                                                                                                                                                                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base URL      | `/api/...` (the Next.js app calls it on its own origin; `next.config.ts` forwards it to the backend)                                                                                                                                                                                                           |
| Auth          | JWT in the httpOnly `token` cookie, set by login/register (token lifetime `JWT_EXPIRE`, default 7 days; the cookie itself expires after a fixed 7 days; cookie `secure` + `sameSite=none` in production, `sameSite=strict` locally). `protect` reads the cookie first, then an `Authorization: Bearer` header. |
| Roles         | Super Admin, Admin, Moderator, Teacher, Student; `authorize(...roles)` per route. No token: 401. Wrong role: 403.                                                                                                                                                                                              |
| Success shape | `{ "success": true, "message"?: "...", "data": ..., "total"?, "page"?, "limit"? }`                                                                                                                                                                                                                             |
| Error shape   | `{ "success": false, "message": "..." }` (`AppError` + global error handler; Mongoose validation, duplicate key and bad id errors become 400)                                                                                                                                                                  |
| Lists         | `page`, `limit` query values; `total` in the response                                                                                                                                                                                                                                                          |
| Uploads       | `multipart/form-data` via Multer (memory storage), stored on Cloudinary. `upload`: images up to 5 MB; `uploadAnyFile`: up to 10 files of 10 MB                                                                                                                                                                 |

## Endpoints

| Method | Path          | Roles  | What it does                                                   |
| ------ | ------------- | ------ | -------------------------------------------------------------- |
| GET    | `/api/health` | Public | Says whether the API is running (used by Docker health checks) |

## Features

### Health check

**What it does:** answers "is the API running?" for Docker health checks, `npm run dev` and monitoring.

**How it works:**

1. Anyone calls `GET /api/health`; no sign-in, no database access.
2. The backend answers 200 with a fixed message and the server time.

**Endpoints**

| Method | Path          | Roles  | Description                |
| ------ | ------------- | ------ | -------------------------- |
| GET    | `/api/health` | Public | API status and server time |

**Example:**

```http
GET /api/health
```

```json
{ "success": true, "message": "Ed-Tech API is running", "timestamp": "2026-10-29T14:17:25.429Z" }
```

**Business rules:** public; never touches the database (so it answers even while MongoDB is down).

**Data model:** none.

**Errors:** an unknown path under `/api` answers 404 `{ "success": false, "message": ... }` (notFound
middleware).

**Fixed issues:** none.

**Tests:** `backend/tests/integration/health.get.test.ts` (200 for anyone; 404 shape for an unknown path).

<!--
TEMPLATE: one section per feature (module), in a stable order.

### <Feature name>

**What it does:** one or two plain sentences.

**How it works:**
1. Step by step: who calls what, what the server checks, what is saved, what else happens (socket events,
   emails, uploads).

**Workflow:** a mermaid diagram when there are more than three steps.

**Endpoints**

| Method | Path | Roles | Description |
| ------ | ---- | ----- | ----------- |

**Example:** one realistic request and response (real response shape).

**Business rules:** every rule the tests check.

**Data model:** collections/fields used (and indexes).

**Errors:** status codes and messages and when.

**Fixed issues:** bugs found by tests or agents and fixed (one line each).

**Tests:** where they are and what they cover.
-->
