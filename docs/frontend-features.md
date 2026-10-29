# Frontend features (Next.js)

Plain-language reference for every screen. Endpoints: [backend-features.md](backend-features.md).

## User workflow

```mermaid
flowchart LR
    V([Visitor]) --> L[Sign in<br/>/auth/login]
    V --> R[Create account<br/>/auth/register]
    R -- "new student" --> S
    L -- student --> S[Student area<br/>/student]
    L -- teacher --> T[Teacher area<br/>/teacher]
    L -- "admin · moderator · super admin" --> A[Admin area<br/>/admin]
```

## Screens

| Route                                                                               | Screen                                    | Who can use it                           |
| ----------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------- |
| `/auth/login`                                                                       | Sign in                                   | Visitors who are not signed in           |
| `/auth/register`                                                                    | Create account                            | Visitors who are not signed in           |
| `/admin/*`, `/student/*`, `/teacher/*`                                              | Signed-in shell (menu, user, sign out)    | The area's roles                         |
| any unknown address                                                                 | Page not found                            | Everyone                                 |
| `/`, `/admin/dashboard`, `/admin/courses`, `/student/dashboard`, `/teacher/courses` | Placeholder ("being moved") until Phase 8 | Home: everyone; others: the area's roles |
| any page that crashes                                                               | Something went wrong                      | Everyone                                 |

## Screen details

### Sign in

**Route:** `/auth/login` · **Menu:** none (public)

**Who can use it:** visitors who are not signed in. A signed-in user who opens it is sent to their home page.

**What it is for:** signing in with email and password.

**How to use it:**

1. Enter the email and password and press **Sign in**. Empty fields show "This field is required"; a badly
   formed email shows "Enter a valid email address" (nothing is sent to the server).
2. A wrong email or password shows the server's message ("Invalid credentials") above the form.
3. On success a toast says "Logged in successfully" and the app opens the page that asked for sign-in
   (`?next=`, only same-site pages the role may open) or the role's home page: Super Admin
   `/admin/dashboard`, Admin and Moderator `/admin/courses`, Teacher `/teacher/courses`, Student
   `/student/dashboard`.
4. "Create an account" opens the register page.

**On mobile:** the card fills the screen width; the illustrated left panel and the corner art are hidden.

**API endpoints used:** `GET /api/auth/me`, `POST /api/auth/login`.

**Code:** `frontend/src/app/auth/login/page.tsx`, `frontend/src/components/auth/` (`LoginForm`, `GuestGate`,
`AuthLayout`), `frontend/src/api/auth.api.ts`, `frontend/src/utils/safe-redirect.ts`.

**Tests:** `components/auth/__tests__/LoginForm.test.tsx`, `GuestGate.test.tsx`,
`utils/__tests__/safe-redirect.test.ts`; Playwright `frontend/e2e/auth.spec.ts` (desktop + mobile).

### Create account

**Route:** `/auth/register` · **Menu:** none (public)

**Who can use it:** visitors who are not signed in. The new account is always a Student.

**What it is for:** a student signs up and is signed in at once.

**How to use it:**

1. Enter full name, email and a password of at least 6 characters, then press **Create account**.
2. An email that already has an account shows "Email is already registered".
3. On success a toast says "Account created successfully" and the student dashboard opens.

**On mobile:** same as Sign in.

**API endpoints used:** `GET /api/auth/me`, `POST /api/auth/register`.

**Code:** `frontend/src/app/auth/register/page.tsx`, `frontend/src/components/auth/RegisterForm.tsx`.

**Tests:** `components/auth/__tests__/RegisterForm.test.tsx`; Playwright `frontend/e2e/auth.spec.ts`.

### Signed-in shell (admin, student, teacher)

**Route:** every page under `/admin`, `/student` and `/teacher` · **Menu:** the sidebar itself

**Who can use it:** `/admin`: Super Admin, Admin, Moderator (`/admin/dashboard`: Super Admin only, others
are sent to `/admin/courses`); `/student`: Students; `/teacher`: Teachers. Visitors who are not signed in
are sent to `/auth/login?next=<page>`; other roles are sent to their own home page.

**What it is for:** the frame around every signed-in page: the menu of the area, the signed-in user and the
sign-out button.

**How to use it:**

1. The menu shows only the items the role may open (for example, Moderators do not see Dashboard, Teachers,
   User List, Subscriptions or Performance; Performance appears under "Analytics" for Super Admins).
2. The current page is highlighted. On desktop the arrow button collapses the menu to icons (tooltips show
   the names); course create/edit and course player pages start collapsed.
3. **Logout** signs out and opens `/auth/login`. If the server cannot be reached, the user stays signed in and
   sees "Could not sign out".

**On mobile:** a top bar with a menu button replaces the sidebar; the menu slides in as a drawer and closes
after choosing a page.

**API endpoints used:** `GET /api/auth/me`, `POST /api/auth/logout`.

**Code:** `frontend/src/app/{admin,student/(shell),teacher}/layout.tsx`, `frontend/src/components/layout/`
(`AppShell`, `SidebarContent`, `nav-items.ts`), `frontend/src/components/permissions/RequireRole.tsx`,
`frontend/src/proxy.ts`.

**Tests:** `components/layout/__tests__/SidebarContent.test.tsx`,
`components/permissions/__tests__/RequireRole.test.tsx`, `src/__tests__/proxy.test.ts`; Playwright
`frontend/e2e/shell.spec.ts` and the access rules in `auth.spec.ts`.

### Placeholder pages (Stage A)

**Route:** `/` (public) and the signed-in landing pages `/admin/dashboard` (Super Admin), `/admin/courses`,
`/student/dashboard`, `/teacher/courses` · **Menu:** Home, Dashboard, Courses, Assigned courses

**Who can use it:** as the shell above; `/` is public.

**What it is for:** gives sign-in a landing page while the real screens are moved from the old client. Each
shows the page title and "This page is being moved to the new app. It will appear here soon." The real
screens replace them in Phase 8; the other menu links show the not-found page until then.

**On mobile:** the same, inside the shell.

**API endpoints used:** none (the shell uses `GET /api/auth/me`).

**Code:** `frontend/src/app/page.tsx`, the `page.tsx` files under
`frontend/src/app/{admin,student/(shell),teacher}`, `frontend/src/components/common/MigratingPage.tsx`.

**Tests:** Playwright `frontend/e2e/auth.spec.ts` (each role lands on its page and sees its heading).

### Something went wrong

**Route:** any page that crashes · **Menu:** none

**Who can use it:** everyone.

**What it is for:** instead of a blank page, a crash shows "Something went wrong", a **Try again** button and a
link to the start page (plus a reference code for server errors). The same screen appears inside a signed-in
area when checking the signed-in user fails for a reason other than "not signed in" (server or network
error); **Try again** repeats the check.

**On mobile:** the buttons stack full width.

**API endpoints used:** none.

**Code:** `frontend/src/app/error.tsx`, `frontend/src/app/global-error.tsx`,
`frontend/src/components/errors/ErrorView.tsx`.

**Tests:** `components/permissions/__tests__/RequireRole.test.tsx` (a failed check shows the screen; Try
again retries).

### Page not found

**Route:** any unknown address · **Menu:** none

**Who can use it:** everyone.

**What it is for:** a friendly 404 page with a button back to the start page.

**On mobile:** the same, centred.

**API endpoints used:** none.

**Code:** `frontend/src/app/not-found.tsx`, `frontend/src/components/errors/NotFoundView.tsx`.

**Tests:** Playwright `frontend/e2e/shell.spec.ts`.

<!--
TEMPLATE: one section per screen, in the order they were built or migrated.

### <Screen name>

**Route:** `/path` · **Menu:** where it is in the sidebar

**Who can use it:** roles.

**What it is for:** one or two plain sentences.

**How to use it:**
1. Step by step: what the user does and sees, including confirmations and error messages.

**On mobile:** what changes (cards instead of a table, filter drawer, full-screen dialogs).

**API endpoints used:** links to backend-features.md.

**Code:** route file and feature folder.

**Tests:** component tests and the Playwright flow (desktop + mobile).
-->
