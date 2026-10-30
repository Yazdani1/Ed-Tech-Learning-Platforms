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

| Route                                                    | Screen                                     | Who can use it                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------------- |
| `/auth/login`                                            | Sign in                                    | Visitors who are not signed in              |
| `/auth/register`                                         | Create account                             | Visitors who are not signed in              |
| `/admin/*`, `/student/*`, `/teacher/*`                   | Signed-in shell (menu, user, sign out)     | The area's roles                            |
| `/`                                                      | Home                                       | Everyone                                    |
| `/teachers`                                              | Our Instructors                            | Everyone                                    |
| `/pricing`                                               | Choose Your Plan (subscription plans)      | Everyone; only Students can subscribe       |
| `/courses`                                               | Course catalog (search, filters, pages)    | Everyone                                    |
| `/free-courses`                                          | Free courses by course type                | Everyone                                    |
| `/courses/[id]`                                          | Course page (details, previews, enrolment) | Everyone; actions depend on the role        |
| `/student/dashboard`                                     | Student dashboard                          | Students                                    |
| `/student/courses`                                       | My Courses                                 | Students                                    |
| `/admin/profile`, `/student/profile`, `/teacher/profile` | My Profile                                 | Everyone signed in (each in their own area) |
| `/admin/categories`                                      | Course setup: categories                   | Super Admin, Admin                          |
| `/admin/course-types`                                    | Course setup: course types                 | Super Admin, Admin                          |
| `/admin/homepage-showcase`                               | Homepage showcase (logo + slider)          | Super Admin, Admin                          |
| any unknown address                                      | Page not found                             | Everyone                                    |
| `/admin/dashboard`, `/admin/courses`, `/teacher/courses` | Placeholder ("being moved") until migrated | The area's roles                            |
| any page that crashes                                    | Something went wrong                       | Everyone                                    |

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

**Route:** the signed-in landing pages `/admin/dashboard` (Super Admin), `/admin/courses` and
`/teacher/courses` · **Menu:** Dashboard, Courses, Assigned courses

**Who can use it:** as the shell above.

**What it is for:** gives sign-in a landing page while the real screens are moved from the old client. Each
shows the page title and "This page is being moved to the new app. It will appear here soon." The real
screens replace them in Phase 8; the other menu links show the not-found page until then.

**On mobile:** the same, inside the shell.

**API endpoints used:** none (the shell uses `GET /api/auth/me`).

**Code:** `frontend/src/app/admin/dashboard/page.tsx`, `frontend/src/app/admin/courses/page.tsx`,
`frontend/src/app/teacher/courses/page.tsx`, `frontend/src/components/common/MigratingPage.tsx`.

**Tests:** Playwright `frontend/e2e/auth.spec.ts` (each role lands on its page and sees its heading).

### Public site frame (discount banner, navbar, footer)

**Route:** every page under `frontend/src/app/(public)/` (home, catalog, course page, teachers, pricing, and
later practice quiz and community hub) · **Menu:** the public navbar

**Who can use it:** everyone, signed in or not.

**What it is for:** the common top and bottom of the public site.

**How to use it:**

1. **Discount banner** (red, above the navbar): shown only while a course discount runs. It says "Up to N% off",
   how many courses are in the offer, and counts down to the end ("ENDS IN 1d 4h 3m 2s", every second). It
   hides itself when the time is up. "View discounted courses" opens `/courses`.
2. **Navbar** (sticks to the top): the site logo uploaded by admins on the Homepage Showcase page (or the
   MedhaBee name when there is none) links home. The search box opens the catalog with the text
   (`/courses?search=...`) and shows the catalog's current search when you are on `/courses`.
3. Links: All Courses, Free Courses, Pricing, Teachers, Practice Quiz, Community Hub. The current page is
   highlighted.
4. Visitors see **Sign In** and **Sign Up**. A signed-in user sees **Dashboard** (their role's home page: Super
   Admin `/admin/dashboard`, Admin and Moderator `/admin/courses`, Teacher `/teacher/courses`, Student
   `/student/dashboard`) and their initial in a round avatar (name on hover).
5. **Footer:** app name, links to Courses, Free Courses, Teachers, Pricing, and the copyright line.

**On mobile:** below 1200 px the links move into a menu drawer opened with the menu button ("Open site menu")
on the right; the drawer also holds Dashboard or Sign In / Sign Up. On phones narrower than 600 px the navbar
shows only the logo icon, the search box, the avatar (when signed in) and the menu button. The banner wraps
onto several lines. Every button is at least 44 px high.

**API endpoints used:** `GET /api/auth/me`, `GET /api/home-hero-posts/logo/public`,
`GET /api/courses/discounts/active`.

**Code:** `frontend/src/app/(public)/layout.tsx`, `frontend/src/components/public/PublicLayout.tsx`,
`frontend/src/components/public/layout/` (`PublicNavbar`, `NavSearch`, `NavAuthActions`, `NavDrawer`,
`SiteLogo`, `DiscountBanner`, `DiscountCountdown`, `PublicFooter`), `frontend/src/api/public.api.ts`,
`frontend/src/schemas/public.schema.ts`.

**Tests:** `components/public/__tests__/PublicLayout.test.tsx`; Playwright `frontend/e2e/public.spec.ts`
(desktop + mobile).

### Home

**Route:** `/` · **Menu:** the logo in the public navbar

**Who can use it:** everyone.

**What it is for:** the landing page: showcase images, subjects, popular courses, the learning formats, the
learning paths and the teachers.

**How to use it:**

1. **Showcase slider:** the public images admins put on the Homepage Showcase page, one after another every
   5 seconds. Arrows and dots switch images by hand. The slider holds still while the mouse is over it or a
   control in it has keyboard focus; the pause/play button stops it for good. For people who turn off
   animations (prefers-reduced-motion) it starts paused. Without images a blue banner is shown.
2. **Explore by Category:** one tile per category. A tile opens the catalog filtered by that category
   (`/courses?categories=<id>`). "View all courses" opens `/courses`.
3. **Popular Courses:** the newest public courses, 8 per page, with page buttons underneath. Each card shows the
   cover, course type, title, teachers, price (struck-through list price and "N% off" while a discount runs,
   or "Free") and category, and opens the course page. A signed-in Student also sees **Continue Learning** on
   courses they are enrolled in (opens the course player). Filters and search are on `/courses`.
4. **Complete learning ecosystem:** a dark band with the learning formats and an animated 3D scene.
5. **Learn what matches your ambition:** one card per course type ("Path 1", "Path 2", …) that opens the
   catalog filtered by it (`/courses?courseTypes=<id>`).
6. **Our Instructors:** two rows of teacher cards scrolling in opposite directions (they pause on hover and stand
   still for people who turn off animations), with a link to `/teachers`.

**On mobile:** one card per row (two on tablets); the slider is 320 px high; the 3D scene is 300 px high and
its three labels stack; the teacher rows still scroll sideways inside their band without making the page
scroll sideways.

**API endpoints used:** `GET /api/home-hero-posts/public`, `GET /api/categories`, `GET /api/course-types`,
`GET /api/courses/browse?page&limit=8`, `GET /api/teachers`, `GET /api/enrollments` (signed-in Students only).

**Code:** `frontend/src/app/(public)/page.tsx`, `frontend/src/components/public/home/` (`HomePage`,
`HomeHeroSlider`, `HeroSliderControls`, `HomeCategoryGrid`, `CategoryCard`, `HomeCourses`, `EcosystemBand`,
`EcosystemVisual`, `ThreeLearningScene` + `three-scene.ts` loaded with `next/dynamic` (browser only),
`CourseTypePaths`, `CourseTypeCard`, `TeacherMarqueeSection`, `TeacherMarqueeRow`, `TeacherMarqueeCard`),
`frontend/src/components/public/common/` (`CourseGrid`, `CourseCard`, helpers), the shared card parts in
`frontend/src/components/course-card/`, `frontend/src/api/catalog.api.ts` (categories, course types, enrolments).

**Tests:** `components/public/__tests__/HomePage.test.tsx`, `public-utils.test.ts`; Playwright
`frontend/e2e/public.spec.ts`.

### Our Instructors

**Route:** `/teachers` · **Menu:** Teachers (public navbar)

**Who can use it:** everyone.

**What it is for:** meet every teacher.

**How to use it:**

1. The page lists every teacher profile: photo (or initial), name, up to four subjects ("+N" for more), a short
   bio and links to Twitter, LinkedIn, website and YouTube when the teacher has them (opened in a new tab; only
   normal web addresses are shown).
2. "No teachers found." when there are none; an error message with **Try again** when the list cannot load.

**On mobile:** one card per row (two on tablets, four on wide screens).

**API endpoints used:** `GET /api/teachers`.

**Code:** `frontend/src/app/(public)/teachers/page.tsx`, `frontend/src/components/public/teachers/`
(`PublicTeachersPage`, `TeacherProfileCard`, `TeacherAvatar`, `ExpertiseChips`, `TeacherSocialLinks`).

**Tests:** `components/public/__tests__/PublicTeachersPage.test.tsx`; Playwright `frontend/e2e/public.spec.ts`.

### Choose Your Plan (pricing)

**Route:** `/pricing` · **Menu:** Pricing (public navbar)

**Who can use it:** everyone can look; only Students can subscribe (same rule as the server).

**What it is for:** compare subscription plans and subscribe. There is no payment gateway yet: subscribing
activates the plan at once and the server takes the price from the plan, never from the browser.

**How to use it:**

1. When plans offer more than one billing period, a switch (Monthly / 3 months / 6 months / Yearly …) chooses
   the period; monthly is chosen first when offered.
2. Each plan card shows its badge, name, the price for that period ("BDT 4,800 for 12 months"), the saving
   against paying monthly ("Save BDT 1,200 (20%)", "BDT 400/mo equivalent"), how many courses are included,
   and its features. A plan without the chosen period says "Not available".
3. **View Included Courses (N)** opens a dialog with the plan's courses, a search box and Category, Course type
   and Pricing filters. "Clear filters" resets them.
4. Visitors see **Get Started** (and "Already have an account?" under the plans): it opens sign-in and comes back
   to `/pricing` afterwards.
5. A Student presses **Subscribe**; a toast says "Subscribed to <plan> plan!". The header then shows "Current
   plan: <plan> - Expires <date>" and that card shows "Current Plan" and a disabled **Active Plan** button.
   With a running plan, the other cards offer **Switch Plan** (or **Switch Billing** for another period of the
   same plan); switching cancels the old subscription on the server.
6. Signed-in staff and teachers see "Only students can subscribe to plans" instead of a button.

**On mobile:** one plan per row (two on tablets); the period switch wraps; the included-courses dialog is full
screen with the filters stacked above the courses.

**API endpoints used:** `GET /api/subscription-plans`, `GET /api/subscriptions/my` (Students),
`POST /api/subscriptions/subscribe` (`{ plan, billingDuration }`), `GET /api/courses/browse?subscriptionPlans=…`
(dialog), `GET /api/categories`, `GET /api/course-types`, `GET /api/enrollments` (Students).

**Code:** `frontend/src/app/(public)/pricing/page.tsx`, `frontend/src/components/public/pricing/`
(`PricingPage`, `PricingHero`, `BillingToggle`, `PlanCard`, `PlanCardContent`, `PlanPrice`, `PlanFeatures`,
`PlanAction`, `PlanCoursesModal`, `PlanCoursesFilters`, `PlanFilterSelect`, `PlanCoursesResults`,
`GuestSignInBox`, `pricing.utils.ts`), `frontend/src/hooks/usePublicSubscribe.ts`,
`frontend/src/hooks/usePublicDebouncedValue.ts`.

**Tests:** `components/public/__tests__/PricingPage.test.tsx`, `public-utils.test.ts`; Playwright
`frontend/e2e/public.spec.ts` (guest is sent to sign in, a new Student subscribes).

### Course catalog (`/courses`)

- **Route:** `/courses` (inside the public layout: navbar + footer).
- **Who can use it:** everyone. A signed-in Student also sees "Go to this course" on courses they are enrolled in.
- **What it is for:** finding a course among all Published + Public courses.
- **Step by step:**
  1. The page shows "All Courses" and how many courses match ("12 courses found").
  2. Type in **Search** (the list updates shortly after you stop typing), tick course types, categories,
     Free / Paid, or subscription plans. Each option shows how many public courses it has.
  3. The filters and the page number are kept in the address bar with the backend's own names, so a link can
     be shared or bookmarked: `?search=react&categories=<id>,<id>&courseTypes=<id>&pricing=Free&subscriptionPlans=Premium&page=2`.
     The public navbar search and the home page tiles link here the same way.
  4. "N active" (in the filter panel) or "Clear filters" (when nothing matches) removes every filter.
  5. Click a card to open the course page. On a computer, hovering a card shows a preview (summary, what you
     will learn, plans that include it, "View Details").
  6. 12 courses per page; the page buttons are under the cards.
- **Mobile behaviour:** one card per row on phones, two on tablets, three or four on desktop. The filter
  sidebar becomes a **Filters** button (with the number of active filters) that opens a drawer; "Show courses
  (N)" closes it. No hover preview on touch screens.
- **API endpoints used:** `GET /api/courses/browse` (filters, `page`, `limit=12`, `filterCounts`),
  `GET /api/categories`, `GET /api/course-types`, `GET /api/subscription-plans`, and for Students
  `GET /api/enrollments` (their course ids).
- **Code:** `frontend/src/app/(public)/courses/page.tsx`, `frontend/src/components/browse/catalog/*`,
  `frontend/src/components/browse/card/*`, `frontend/src/hooks/useBrowseParams.ts`,
  `frontend/src/api/browse.api.ts`, `frontend/src/api/catalog.api.ts` (categories, course types, plans,
  enrolments), `frontend/src/schemas/browse.schema.ts`, `frontend/src/schemas/catalog.schema.ts`, the shared
  card parts and search box in `frontend/src/components/course-card/`, prices in `frontend/src/utils/price.ts`.
- **Tests:** `frontend/src/components/browse/__tests__/CourseBrowseView.test.tsx`, `e2e/browse.spec.ts`.

### Free courses (`/free-courses`)

- **Route:** `/free-courses`.
- **Who can use it:** everyone (enrolled Students see "Go to this course" on their courses).
- **What it is for:** a quick list of every free public course.
- **Step by step:**
  1. The page shows how many free courses there are.
  2. Courses are grouped by course type (with the type's description); courses without a type come last under
     "Other Free Courses".
  3. Each group shows up to six cards; "See all <type> courses" opens `/courses?courseTypes=<id>&pricing=Free`.
- **Mobile behaviour:** one card per row on phones, two on tablets, three on desktop.
- **API endpoints used:** `GET /api/courses/browse?pricing=Free`, `GET /api/course-types`,
  `GET /api/enrollments` (Students only).
- **Code:** `frontend/src/app/(public)/free-courses/page.tsx`, `frontend/src/components/browse/free/*`.
- **Tests:** `frontend/src/components/browse/__tests__/FreeCoursesView.test.tsx`, `e2e/browse.spec.ts`.

### Course page (`/courses/[id]`)

- **Route:** `/courses/[id]`.
- **Who can use it:** everyone for Published + Public courses. Drafts and private courses answer "Course not
  found." except for staff and the course's teachers (the backend decides).
- **What it is for:** everything about one course and how to get it.
- **Step by step:**
  1. The dark banner shows the breadcrumb, title, subtitle, status, price (with discount), course type,
     "Subscription" and the teachers.
  2. Below: course type and start / end dates, "What you'll learn", "This course includes", **Course content**,
     requirements, "About this course" (rich text, sanitised) and "Your Instructors".
  3. **Course content** has up to three lists, switched with buttons: **Recorded Lectures** (sections with
     lecture count and length; "Expand all sections"), **Live Class** (weekly plan with each class's day and
     time, as the teacher wrote them) and **Quizzes** (free-preview quiz banks, each opening
     `/practice-quiz?courseId=…&bankId=…`).
  4. A lecture marked "Free Preview" with a YouTube video opens the preview player (with the list of every
     other free preview). Locked lectures have no video address for viewers without access.
  5. The card on the right (top on phones) depends on the viewer:
     - **Visitor:** price, "Enroll Free" / "Get Started" (to sign-up) and "Sign In".
     - **Student, not enrolled:** "Enroll Now – Free" / "Buy Now". When the course is part of subscription
       plans there are two choices: **Subscribe and save** (cheapest plan price; "Enroll with Subscription"
       when the student's running plan includes the course, "Upgrade Subscription" when it does not, otherwise
       a link to the plans) or **Buy this course** (always a direct, paid enrolment).
     - **Student, enrolled:** "Go to this course" (`/student/courses/[id]/learn`), the enrolment date and
       "Leave this course" (asks for confirmation).
     - **Super Admin / Admin:** "Edit Course" and "Student View"; **Moderator:** "Student View" only.
     - **Teacher:** the price only.
  6. If the course has a "Course introduction" lecture (or any free preview) on YouTube, the card's picture plays it.
- **Mobile behaviour:** single column; the enrolment card comes right after the banner; the preview player
  opens full screen with the preview list under the video.
- **API endpoints used:** `GET /api/courses/:id`, `GET /api/study-curricula/course/:id` (public fields for
  guests), `GET /api/quiz-bank/public/course/:id`, `GET /api/subscription-plans`; Students:
  `GET /api/enrollments/:courseId/check`, `GET /api/subscriptions/my`, `POST /api/enrollments/:courseId`
  (body `{ enrollmentType: 'paid' }` when buying a paid course directly), `DELETE /api/enrollments/:courseId`.
- **Security:** YouTube is the only embedded site (CSP `frame-src https://www.youtube.com
https://www.youtube-nocookie.com`, thumbnails `img-src https://i.ytimg.com`); videos are embedded from the
  11-character id only, through the privacy-enhanced domain. Cover and teacher pictures are shown only from
  Cloudinary. Rich text goes through `SafeHtml`.
- **Code:** `frontend/src/app/(public)/courses/[id]/page.tsx`, `frontend/src/components/browse/detail/*`
  (`content/` = course content lists, `enrollment/` = the enrolment card), `frontend/src/utils/csp.ts`.
- **Tests:** `frontend/src/components/browse/__tests__/CourseDetailView.test.tsx`,
  `frontend/src/components/browse/__tests__/course-utils.test.ts`, `frontend/src/utils/__tests__/csp.test.ts`,
  `e2e/browse.spec.ts`.

### Student dashboard

**Route:** `/student/dashboard` · **Menu:** Dashboard (student menu)

**Who can use it:** students. It is where a student lands after signing in.

**What it is for:** a quick start: a welcome, how many courses the student is in, the running plan, and the
newest courses to continue.

**How to use it:**

1. The header says "Welcome back, <name>. Continue your courses from the course page."
2. Two cards show the number of **Enrolled courses** and the **Subscription** (plan name and "Expires
   <date>", or "None / No active plan"). A plan whose end date has passed counts as none.
3. Without a running plan a **View Plans** button opens `/pricing`.
4. **Continue learning** lists the four newest enrolments (with "Free course", "Purchased course" or "Enrolled
   with subscription"); a click opens the course player `/student/courses/<id>/learn`. **All my courses**
   opens `/student/courses`. With no enrolments it says "You haven't enrolled in any courses yet." and offers
   **Browse Courses** (`/courses`).
5. Loading shows skeletons; a failed load shows the server message with **Try again**.

**On mobile:** the two cards stack in one column; list rows are at least 56 px high.

**API endpoints used:** `GET /api/auth/me`, `GET /api/enrollments`.

**Code:** `frontend/src/app/student/(shell)/dashboard/page.tsx`, `frontend/src/components/student/`
(`StudentDashboard`, `DashboardStatCard`, `ContinueLearning`), `frontend/src/api/catalog.api.ts`,
`frontend/src/api/profile.api.ts`.

**Tests:** `components/student/__tests__/StudentDashboard.test.tsx`; Playwright `frontend/e2e/student.spec.ts`.

### My Courses

**Route:** `/student/courses` (`?search=` keeps the search box) · **Menu:** My Courses (student menu)

**Who can use it:** students (only their own enrolments).

**What it is for:** every course the student is enrolled in, opening the course player, and leaving a course.

**How to use it:**

1. The courses come in two groups, each with its count: **Free & Paid Courses** and **Enrolled with
   Subscription** (cards with a purple "Subscription" badge). An empty group says "No free or paid courses
   enrolled yet." / "No subscription courses enrolled yet."
2. Each card shows the cover, course type badge, title, teachers, the price ("Free", or the price with the
   struck-through list price and "% off" while a discount runs) and the category. A click opens
   `/student/courses/<id>/learn`.
3. **Search courses...** filters by title as you type; the address (`?search=`) follows once you stop typing; nothing found shows
   `No courses match "<text>".`
4. The bin button on a card ("Remove from my courses") asks "Are you sure you want to remove "<title>" from
   your courses?"; **Remove** deletes the enrolment, shows `Removed from "<title>"` and drops the card.
   An error shows the server message as a toast.
5. No enrolments at all: "You haven't enrolled in any courses yet."

**On mobile:** one card per row (two on tablets, three to four on desktops); the search box is full width; the
remove button is 44 px.

**API endpoints used:** `GET /api/enrollments`, `DELETE /api/enrollments/:courseId`.

**Code:** `frontend/src/app/student/(shell)/courses/page.tsx`, `frontend/src/components/student/`
(`MyCoursesPage`, `EnrolledCourseSection`, `EnrolledCourseCard`, `CourseBadges`, `CourseCardSkeletons`,
`useRemoveEnrollment`, `enrolledCourse.utils.ts`), the shared `CourseCover`, `CourseCardBody`, `CoursePrice`
and `CourseSearchField` in `frontend/src/components/course-card/`, `frontend/src/api/catalog.api.ts`,
`frontend/src/schemas/catalog.schema.ts`, `frontend/src/schemas/student.schema.ts`.

**Tests:** `components/student/__tests__/MyCoursesPage.test.tsx`; Playwright `frontend/e2e/student.spec.ts`.

### My Profile

**Route:** `/admin/profile`, `/student/profile`, `/teacher/profile` · **Menu:** Profile

**Who can use it:** every signed-in user, in their own area (Super Admin, Admin, Moderator under `/admin`).
Only their own account.

**What it is for:** seeing the account, plan and role, and editing name, avatar, community privacy, password
and (students only) email.

**How to use it:**

1. The banner shows the role, avatar (or the first letter in the role's colour), name and what the role is
   for; below are email, role, joined and last-updated dates.
2. Summary cards: **Enrolled courses** (students) or **Assigned courses** (teachers), **Purchased courses**,
   **Subscription** (plan and expiry) and **Profile status** (Complete with an avatar, otherwise Basic).
3. Students also see the **Subscription** card: the running plan with start/expiry dates, the number of
   courses and features of the plan, **Change Plan** (`/pricing`) and **Cancel Subscription** (asks first,
   then "Subscription cancelled"); without a plan "You do not have an active subscription." and **View
   Plans**. Everyone sees **Role details** (role, kind of access, description).
4. **Edit Profile** opens a dialog:
   - **Upload Avatar** (JPG, PNG, WEBP or GIF up to 5MB, checked before upload) shows a preview;
     **Remove** removes the picture.
   - **Name** is required. **Email** can be changed by students only; for other roles it is read-only.
   - **Private community profile** hides the community stats, discussions and answers from others.
   - **Change password**: current password, new password (6-72 characters) and confirmation. Leave empty to
     keep the password. A student who changes the email must also type the current password.
   - **Save Changes** sends only what changed ("Make at least one change before saving." otherwise). Errors
     from the server (wrong current password, email in use) appear above the fields. On success a toast says
     "Profile updated", the dialog closes and the name/avatar update at once (also in the sidebar).
     Changing the password signs out other devices; this browser gets a fresh session cookie.

**On mobile:** cards stack in one column; the dialog is full screen; the two new-password fields stack.

**API endpoints used:** `GET /api/auth/me`, `PUT /api/auth/me` (multipart), `GET /api/enrollments`
(students), `GET /api/teachers/my-courses` (teachers), `GET /api/subscription-plans` and
`DELETE /api/subscriptions/cancel-my` (students with a plan).

**Code:** `frontend/src/app/{admin,student/(shell),teacher}/profile/page.tsx`,
`frontend/src/components/profile/` (`ProfilePage`, `ProfileHero`, `ProfileFacts`, `ProfileStats`,
`SubscriptionCard`, `ActivePlanDetails`, `RoleDetailsCard`, `EditProfileModal`, `AvatarPicker`,
`AvatarUploadButton`, `CommunityPrivacySwitch`, `ProfilePasswordFields`, `useProfileForm`,
`useAvatarChoice`, `profileFormData.ts`), `frontend/src/api/profile.api.ts`, `frontend/src/api/catalog.api.ts`
(plans, enrolments, cancelling the subscription),
`frontend/src/schemas/profile.schema.ts`.

**Tests:** `components/profile/__tests__/ProfilePage.test.tsx`, `EditProfileModal.test.tsx`; Playwright
`frontend/e2e/profile.spec.ts` (desktop + mobile).

### Course setup (categories and course types)

**Route:** `/admin/categories` (Categories tab) and `/admin/course-types` (Course Types tab) · **Menu:**
"Course Setup" (opens the Categories tab)

**Who can use it:** Super Admin and Admin. A Moderator (or any other role) who opens the address is sent to
their own home page; the backend refuses their requests too (403).

**What it is for:** keeping the two short lists that courses are filed under: categories (subject areas)
and course types (live course, recorded course, seminar, ...). The public catalog filters use them.

**How to use it:**

1. Pick a tab: **Categories** or **Course Types**. Each tab has its own address, so it can be bookmarked.
2. The list shows each item's name, slug (made by the server from the name) and description, plus how many
   items there are.
3. **Add Category** / **Add Course Type** opens a form: name (required, must contain letters or numbers) and
   an optional description. **Save** creates it; a toast confirms it. A name that clashes with an existing
   one shows the server's message in the form.
4. The row menu (⋮) has **Edit** (same form, filled in; **Update** saves) and **Delete** (asks "Delete
   "<name>"? This cannot be undone." first).
5. An item that courses still use cannot be deleted: the server's message is shown as a toast, for example
   "Category is used by 3 course(s)".

**On mobile:** the tabs fill the width; each item is a card (name, slug, description, ⋮ menu) instead of a
table row; the form opens full screen.

**API endpoints used:** `GET/POST /api/categories`, `PUT/DELETE /api/categories/:id`,
`GET/POST /api/course-types`, `PUT/DELETE /api/course-types/:id`.

**Code:** `frontend/src/app/admin/categories/page.tsx`, `frontend/src/app/admin/course-types/page.tsx`,
`frontend/src/components/setup/` (`CourseSetupPage`, `SetupTabs`, `SetupManager`, `SetupManagerHeader`,
`SetupItemFormModal`, `SetupRowMenu`, `useSetupColumns`), `frontend/src/api/setup.api.ts` (the list is the
shared read in `frontend/src/api/catalog.api.ts`, so a save also refreshes the public pages),
`frontend/src/schemas/setup.schema.ts`.

**Tests:** `components/setup/__tests__/CourseSetupPage.test.tsx` (list, empty, error, create, validation,
duplicate error, edit, delete, in-use delete refused, course types tab, Moderator sent away); Playwright
`frontend/e2e/setup.spec.ts` (desktop + mobile: add/edit/delete a category, add a course type from the tab,
Moderator blocked).

### Homepage showcase

**Route:** `/admin/homepage-showcase` · **Menu:** "Homepage Showcase"

**Who can use it:** Super Admin and Admin (others are sent to their home page; the backend answers 403).

**What it is for:** managing the public site logo and the wide banner images of the homepage slider: upload,
show or hide, schedule, reorder and delete.

**How to use it:**

1. **Site logo:** the current logo is shown (or "No logo uploaded yet."). **Choose logo image** picks a PNG,
   JPEG, GIF or WEBP file up to 5 MB; its name and size appear. **Save Logo** (or **Update Logo** when one
   exists) uploads it and replaces the old one. A wrong file type or a file over 5 MB is refused at once with
   a message, before anything is sent.
2. **Header slider images:** every image is listed in slider order with its position (#1, #2, ...),
   visibility (Public / Private), a "Scheduled to ..." chip when a change is pending, its size in pixels and
   when it publishes ("Publishes immediately when public", "Publishes <date>" or "Changes to Public
   <date>", in your own time zone).
3. **Upload Images** opens a form: choose one or more images (up to 10, each PNG/JPEG/GIF/WEBP up to 5 MB),
   visibility, an optional publish date and time (a future date keeps the image as it is until then, then
   applies the chosen visibility), and a position (lower numbers come first; it starts after the last image).
   **Upload** is enabled once at least one valid image is chosen.
4. Change the order by dragging an image by its handle (⋮⋮), or with **Move Up** / **Move Down** in its menu.
   The new order shows at once and is saved; if saving fails, the old order comes back and an error toast is
   shown. Keyboard: focus the handle, press space, move with the arrow keys, press space again.
5. The image menu (⋮) also has **View Details** (large preview with visibility, size, position and schedule;
   clicking the thumbnail does the same), **Edit** (replace the image, change visibility, date or position;
   clearing the date applies the visibility now), **Make Public** / **Make Private** (applies at once and
   cancels a pending schedule) and **Delete** (asks first).
6. Server errors (for example "Only image files are allowed" for a file whose content is not a real image)
   are shown in the form or as a toast.

**On mobile:** the logo preview sits above the logo controls; each slider image is a card with the full-width
banner on top and the handle, details and menu below; dialogs open full screen.

**API endpoints used:** `GET/PUT /api/home-hero-posts/logo`, `GET/POST /api/home-hero-posts`,
`PUT/DELETE /api/home-hero-posts/:id`, `PATCH /api/home-hero-posts/reorder`.

**Code:** `frontend/src/app/admin/homepage-showcase/page.tsx`, `frontend/src/components/showcase/`
(`HomepageShowcasePage`, `SiteLogoPanel`, `LogoPreview`, `LogoPicker`, `HeroPostsPanel`,
`HeroPostSortableList` (drag and drop, loaded with `next/dynamic`), `HeroPostRow`, `HeroPostThumbnail`,
`HeroPostMenu`, `HeroPostFormModal`, `HeroPostFormFields`, `HeroFilePicker`, `HeroPostDetailsModal`,
`useHeroPostActions`, `useHeroText`, `useImageFiles`, `hero-form.ts`, `hero-schedule.ts`, `image-files.ts`,
`common/`), `frontend/src/api/showcase.api.ts`, `frontend/src/schemas/showcase.schema.ts`.

**Tests:** `components/showcase/__tests__/HomepageShowcasePage.test.tsx` (logo + list with details, empty
states, list error, logo upload, wrong logo type refused, multi-image upload body, upload refused by the
server, edit, make public, move down (reorder body), Move Up disabled on the first image, delete, details
dialog, Moderator sent away); Playwright `frontend/e2e/showcase.spec.ts` (desktop + mobile: page sections,
non-image file refused in the upload dialog, Moderator blocked). Real uploads are not run end to end because
the e2e stack has no Cloudinary account.

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
