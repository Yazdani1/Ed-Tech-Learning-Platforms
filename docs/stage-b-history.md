# Stage B history

What each Stage B batch added, in order. CLAUDE.md keeps only a short summary; read this file when a task touches one of these areas. Each new batch adds a section here (module-workflow step 7).

## Stage B batch 1 (2026-11-01)

slider captions + right-side drawer editor (`components/common/SideDrawer`, one image per upload); student numbers (`User.studentNumber`, 123-456-789, backfilled at start-up); `/api/site-settings` (Super Admin Site Pages: hidden public pages answer "not found" via `PageVisibilityGate`; Company Contact); `/api/tools` (Course Setup > Tools); course page sections (`PATCH /api/courses/:id/extras`, pictures via `POST /api/courses/:id/images`): tools, what you get, projects, audience, success stories, FAQ; course page "Curriculum" tabs and sticky buy bar. Promo codes are NOT built (the bar shows the running discount).

## Stage B batch 2 (2026-11-02)

dashboard = revenue today / last 7 days / this month / all time (viewer's time zone via `?tz=`, `utils/reportPeriods.ts` with Luxon in the backend, money rules in `utils/revenue.ts`), daily and monthly revenue charts, top 5 courses by revenue (role/status/pricing charts and recent lists removed); performance = several courses (`courseIds`), ranges today|7d|30d|month|lifetime|custom (from/to), shared left multi-select picker `components/course-picker`; `/admin/students` + `/api/students` (Super Admin, Admin); optional `User.phone` (register, profile, admin form); course page: curriculum and later sections full width, FAQ cards; `/courses`: no sidebar, one box per course type (paid courses, `filterCounts.paidByCourseType`) + Free box, plain results only with a search/filter in the URL. Known gap: a paid course without a course type is only found by search.

## Stage B batch 3 (2026-11-04, frontend only)

new course page (full-width white section cards in a fixed order, `extras/DetailSection`, `TopBarCard`), `/courses/[id]/payment` (`components/payment`; design only: no gateway, the pay button does the existing paid enrolment), new home course card and category pills, gradient `PublicFooter`, fonts through `app/fonts.ts` + `theme/fonts.ts`. Known gaps: no Wishlist, promo code, batch number or support class time (they need backend fields).

## Stage B batch 4 (2026-11-05)

`CourseType.isLive` and `browse?liveOnly` removed: the home page and `/courses` show one box per course type (`components/public/common/CourseTypeSections`) plus the free courses; Company Contact has social links (footer icons) and the email refuses mailto parameters; grouped admin menu (`NAV_SECTIONS`); course page bands for Instructors and Projects (`DetailSection band`), foldable About text, animated Enroll Now.

## Stage B batch 5 (2026-11-06)

coupons, one per order (`utils/courseOffer.ts`): the course's own discount is its auto coupon (`Course.discountCode/StartsAt/EndsAt`, Pricing tab), course coupons (`/api/coupons`, Coupons tab), promos for many courses (`/api/promos`, `/admin/promos`, home banner + pop-up, `/promo`); public course reads carry `offer`; the enrolment price = list price less the code sent (`couponCode`, also `paymentMethod`). `/admin/revenue` (`/api/revenue`: charts, orders, CSV, browser print-out saved as PDF), `/admin/announcements` (broadcasts to many courses, seen counts), course views (`POST /api/courses/:id/view`, one per visitor per day), `CourseType.position`, `Course.batchNumber` (4 digits, unique), schedules text, `firstPublishedAt` (a course published once is never deleted; unpublish moved to the editor's Settings tab; enrolled students keep unpublished courses). Sign in / register are a right-side panel (`?auth=login|register`, `components/auth/AuthDrawer`; `/auth/*` only redirect). Students: no dashboard (home `/student/courses`), no unenrol (DELETE removed), no Pricing menu item. Dashboard top bar user (student ID for students). Custom `ListPagination` (only with more than one page; 10 per page).
